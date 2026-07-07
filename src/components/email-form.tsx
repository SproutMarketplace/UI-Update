'use client';

import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CircleCheck, PartyPopper, Copy, Check, ShieldCheck, RefreshCw, Trophy, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFirebaseClient } from '@/lib/firebase-client';
import { 
  createUserWithEmailAndPassword, 
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  getDocs, 
  collection, 
  query, 
  where, 
  limit, 
  getCountFromServer,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { cn } from '@/lib/utils';

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", 
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", 
  "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", 
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", 
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

const signupSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z.string().min(6, { message: "Password must be at least 6 characters." }),
    confirmPassword: z.string(),
    userType: z.enum(["buyer", "seller"], { required_error: "Please select an option." }),
    state: z.string().min(1, { message: "Please select your state." }),
    referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

interface FormState {
  message: string;
  success: boolean;
  timestamp?: number;
  referralCode?: string;
}

async function signUpClientSide(values: SignupFormValues): Promise<FormState> {
  const { name, email, password, userType, state, referralCode: referralCodeInput } = values;
  const { auth, db } = getFirebaseClient();

  if (!auth || !db) {
    return { success: false, message: "Firebase is currently offline. Please try again later.", timestamp: Date.now() };
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName: cleanName });

    const usersCollection = collection(db, 'users');
    let referredByUID: string | null = null;
    
    if (referralCodeInput && referralCodeInput.trim() !== "") {
      const uppercaseReferralCode = referralCodeInput.trim().toUpperCase();
      const q = query(usersCollection, where('referralCode', '==', uppercaseReferralCode), limit(1));
      const referringUserQuery = await getDocs(q);
      if (!referringUserQuery.empty) {
        referredByUID = referringUserQuery.docs[0].id;
      }
    }
    
    const usersSnapshot = await getCountFromServer(usersCollection);
    const userCount = usersSnapshot.data().count;

    let rewardTier = 'standard';
    let successMessage = "Congratulations! You're one of our first 100 users and get 1 month of the Sprout Plan!";
    let templateId = parseInt(process.env.NEXT_PUBLIC_MAILJET_TEMPLATE_ID || '0');
    
    if (userCount >= 100) {
      rewardTier = 'standard';
      successMessage = "You've successfully signed up! While the first 100 spots are taken, you can still get a free month of the Sprout Plan by referring friends.";
      templateId = parseInt(process.env.NEXT_PUBLIC_MAILJET_STANDARD_TEMPLATE_ID || '0');
    }

    let newReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    await runTransaction(db, async (transaction) => {
      const newUserDocRef = doc(db, 'users', user.uid);
      transaction.set(newUserDocRef, {
        userId: user.uid,
        username: cleanName,
        email: cleanEmail,
        state: state,
        createdAt: serverTimestamp(),
        rewardTier: rewardTier,
        userType: userType,
        referralCode: newReferralCode,
        referrals: 0,
        referredBy: referredByUID,
        sproutMonthsEarned: 0,
        rewardPoints: 0,
      });

      if (referredByUID) {
        const referringUserDocRef = doc(db, 'users', referredByUID);
        const referringUserDoc = await transaction.get(referringUserDocRef);
        if (referringUserDoc.exists()) {
          const referringUserData = referringUserDoc.data();
          const newReferralCount = (referringUserData.referrals || 0) + 1;
          let updates: {[key: string]: any} = { referrals: newReferralCount };
          if (newReferralCount >= 10) {
              updates.sproutMonthsEarned = (referringUserData.sproutMonthsEarned || 0) + 1;
              updates.referrals = 0; 
          }
          transaction.update(referringUserDocRef, updates);
        }
      }
    });

    if (templateId !== 0) {
        try {
            await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: cleanEmail, name: cleanName, templateId }),
            });
        } catch (apiError) {
            console.warn(`Welcome email delivery skipped.`, apiError);
        }
    }
    
    return { success: true, message: successMessage, referralCode: newReferralCode, timestamp: Date.now() };

  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
        return { success: false, message: "You're already signed up!", timestamp: Date.now() };
    }
    return { success: false, message: 'There was an issue securing your spot.', timestamp: Date.now() };
  }
}

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button
      type="submit"
      disabled={isPending}
      className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-300 text-base font-bold rounded-xl"
      aria-live="polite"
    >
      {isPending ? (
        <>
          <span className="animate-spin h-5 w-5 mr-2 border-t-2 border-b-2 border-primary-foreground rounded-full"></span>
          Joining...
        </>
      ) : (
        <>
          <ShieldCheck className="mr-2 h-5 w-5" />
          Join The Waitlist
        </>
      )}
    </Button>
  );
}

function ReferralDisplay({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: "Referral code copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-8 w-full text-center p-6 border-2 border-dashed border-primary/30 rounded-2xl bg-primary/5">
        <h3 className="font-bold text-lg text-primary">Grow Together!</h3>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Share your unique code with friends. For every 10 signups, you'll earn another <strong>free month of the Sprout Plan</strong>.
        </p>
        <div className="mt-5 flex justify-center items-center gap-3">
            <div className="flex-1 font-mono text-2xl tracking-[0.2em] text-primary font-black bg-card px-5 py-3 rounded-xl border border-border shadow-sm">
                {code}
            </div>
            <Button onClick={copyToClipboard} size="icon" variant="outline" className="h-14 w-14 rounded-xl text-primary border-primary/20 hover:bg-primary/10 transition-colors">
                {copied ? <Check className="w-6 h-6 text-green-600" /> : <Copy className="w-6 h-6" />}
                <span className="sr-only">Copy referral code</span>
            </Button>
        </div>
    </div>
  );
}

function PrizeVisualBundle() {
  const prizes = [
    { name: "Blue Oyster Kit", img: "/blueoyster.jpeg" },
    { name: "Lion's Mane Kit", img: "/lions.png" },
    { name: "Anthurium Veitchii King Tissue Culture", img: "/AV.webp" },
    { name: "Astrophytum Asterias", img: "/Astro.jpeg" },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center py-6">
      <div className="mb-4 bg-accent text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl border-2 border-white z-50">
        <Trophy className="w-3.5 h-3.5" />
        You&apos;ve been entered to win:
      </div>
      <div className="relative flex items-center justify-center">
        <div className="flex -space-x-6 hover:space-x-2 transition-all duration-500 ease-in-out">
          {prizes.map((p, idx) => (
            <div 
              key={idx} 
              className="group/prize relative w-20 h-20 rounded-2xl border-4 border-white shadow-2xl overflow-hidden bg-white transform hover:-translate-y-2 transition-transform duration-300"
              style={{ zIndex: prizes.length - idx }}
            >
              <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/prize:opacity-100 transition-opacity duration-300 pointer-events-none">
                <span className="text-[10px] text-white font-black uppercase tracking-wider text-center px-1 leading-tight">
                  {p.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EmailForm() {
  const [state, setState] = useState<FormState>({ success: false, message: '' });
  const [isPending, startTransition] = useTransition();
  const [isMounted, setIsMounted] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      referralCode: "",
      userType: "buyer",
      state: ""
    },
  });

  useEffect(() => {
    setIsMounted(true);
    const storedStateRaw = localStorage.getItem('sprout_signup_state');
    if (storedStateRaw) {
        try {
            const storedState = JSON.parse(storedStateRaw);
            if(storedState.success && storedState.referralCode) {
                setState(storedState);
            }
        } catch(e) {
            console.error("Parse error", e);
        }
    }
  }, []);

  const onSubmit = (data: SignupFormValues) => {
    startTransition(async () => {
      const result = await signUpClientSide(data);
      setState(result);
    });
  };

  const handleReset = () => {
    localStorage.removeItem('sprout_signup_state');
    setState({ success: false, message: '' });
    form.reset();
  };

  useEffect(() => {
    if (state.timestamp && !state.success) {
       form.setError("root.serverError", {
        type: "manual",
        message: state.message,
      });
    }
  }, [state, form]);

  useEffect(() => {
    if (state.success) {
      form.reset();
      localStorage.setItem('sprout_signup_state', JSON.stringify(state));
    }
  }, [state, form]);

  if (!isMounted) return <div className="min-h-[400px] flex items-center justify-center"><div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full" /></div>;

  if (state.success) {
    const isEarlyBird = (state.message || '').toLowerCase().includes('congratulations');
    
    return (
      <div className="p-2 animate-fade-in-up" role="alert">
        <div className="flex flex-col items-center text-center">
            <div className="space-y-4 mb-8">
              {isEarlyBird && (
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border border-primary/20">
                  <Sparkles className="w-3 h-3" />
                  Early Bird Reward Unlocked
                </div>
              )}
              
              <h2 className="text-3xl font-black text-primary font-headline tracking-tight leading-[1.1]">
                {state.message}
              </h2>
              
              <p className="text-muted-foreground text-lg leading-relaxed max-w-sm mx-auto">
                We&apos;ve secured your spot, entered you into the Grand Prize Giveaway, and will reach out the moment Sprout goes live!
              </p>
            </div>

            <div className="w-full mb-4">
              <PrizeVisualBundle />
            </div>

            {state.referralCode && <ReferralDisplay code={state.referralCode} />}
            
            <Button 
              onClick={handleReset} 
              variant="ghost" 
              className="mt-8 text-muted-foreground hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest"
            >
              <RefreshCw className="mr-2 h-3 w-3" />
              Reset & Test Signup Again
            </Button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold font-headline text-primary">Join The Waitlist!</h2>
        <p className="text-muted-foreground text-sm mt-2 font-medium">Join the next generation of plant & mushroom marketplaces.</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Full Name</FormLabel>
                        <FormControl>
                            <Input className="h-12 rounded-xl focus-visible:ring-primary/30" placeholder="Jane Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                         <FormLabel className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Email Address</FormLabel>
                        <FormControl>
                            <Input className="h-12 rounded-xl focus-visible:ring-primary/30" type="email" placeholder="jane@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                      <FormItem>
                          <FormLabel className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Password</FormLabel>
                          <FormControl>
                              <Input className="h-12 rounded-xl focus-visible:ring-primary/30" type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                  )}
              />
              <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                      <FormItem>
                          <FormLabel className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Confirm</FormLabel>
                          <FormControl>
                              <Input className="h-12 rounded-xl focus-visible:ring-primary/30" type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                  )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">U.S. State</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 rounded-xl focus:ring-primary/30">
                        <SelectValue placeholder="Select your state" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {US_STATES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
                control={form.control}
                name="userType"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Your Primary Role</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div>
                          <RadioGroupItem value="buyer" id="role-buyer" className="sr-only" />
                          <Label
                            htmlFor="role-buyer"
                            className={cn(
                              "flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-border cursor-pointer hover:bg-muted transition-all text-center",
                              field.value === "buyer" && "border-primary bg-primary/5 text-primary"
                            )}
                          >
                            <span className="font-bold">I&apos;m a Buyer</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="seller" id="role-seller" className="sr-only" />
                          <Label
                            htmlFor="role-seller"
                            className={cn(
                              "flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-border cursor-pointer hover:bg-muted transition-all text-center",
                              field.value === "seller" && "border-primary bg-primary/5 text-primary"
                            )}
                          >
                            <span className="font-bold">I&apos;m a Seller</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
                control={form.control}
                name="referralCode"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Referral Code (Optional)</FormLabel>
                        <FormControl>
                            <Input className="h-12 rounded-xl focus-visible:ring-primary/30 uppercase" placeholder="ABC123" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            
          <div className="pt-6 space-y-4">
              <SubmitButton isPending={isPending} />
              <p className="text-xs text-muted-foreground text-center italic font-medium px-4">
                <strong>* Sprout Marketplace is currently accepting waitlist sign-ups for U.S. Residents Only. *</strong>
              </p>
          </div>

          {form.formState.errors.root?.serverError && (
            <div className="text-destructive text-sm font-bold mt-2 text-center bg-destructive/10 p-3 rounded-lg border border-destructive/20" role="alert">
              {form.formState.errors.root.serverError.message}
            </div>
          )}
        </form>
      </Form>
    </>
  );
}
