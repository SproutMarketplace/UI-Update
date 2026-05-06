import Image from 'next/image';
import { EmailForm } from '@/components/email-form';
import { Instagram, Facebook, Twitter, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import placeholderImages from '@/app/lib/placeholder-images.json';

export default function LandingPage() {
  const prizes = [
    { 
      name: "Blue Oyster Kit", 
      label: "Golden Mushroom Company", 
      imageUrl: "/blueoyster.jpeg"
    },
    { 
      name: "Lion's Mane Kit", 
      label: "Golden Mushroom Company", 
      imageUrl: "/lions.png"
    },
    { 
      name: "Anthurium Veitchii King Tissue Culture", 
      label: "Rare Anthurium", 
      imageUrl: "/AV.webp"
    },
    { 
      name: "Astrophytum Asterias", 
      label: "Collectors Cactus", 
      imageUrl: "/Astro.jpeg"
    },
  ];

  return (
    <div className="flex flex-col min-h-screen text-foreground font-body">
      {/* Hero Section */}
      <section className="relative w-full min-h-[90vh] flex flex-col overflow-hidden">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0">
          <Image
            src={placeholderImages.heroBackground.url}
            alt={placeholderImages.heroBackground.alt}
            fill
            className="object-cover"
            priority
            data-ai-hint={placeholderImages.heroBackground.hint}
          />
          {/* Subtle overlay for text readability */}
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" />
        </div>

        {/* Header Content - Logo */}
        <header className="relative w-full px-6 py-2 z-20">
          <Image
            src="/sprout.png"
            alt="Sprout Logo"
            width={180}
            height={50}
            className="brightness-0 invert opacity-95 h-auto"
            data-ai-hint="company logo"
          />
        </header>

        {/* Main Content - Centered vertically with Signup Box */}
        <div className="relative flex-1 flex items-center z-10 -mt-16 md:-mt-24">
          <div className="w-full max-w-7xl mx-auto px-6 py-8 grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Branding & Value Proposition (Shifted up slightly for center alignment) */}
            <div className="lg:col-span-7 space-y-8 text-white lg:-mt-10">
              <div className="space-y-6">
                <h1 className="font-headline text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight animate-fade-in-down">
                  Buy, Sell, & Trade <br />
                  <span className="text-[#4ade80] drop-shadow-sm">Plants & Mushrooms</span>
                </h1>
                <p className="text-xl md:text-2xl font-medium text-white/90 max-w-2xl leading-relaxed animate-fade-in-down" style={{ animationDelay: '0.1s' }}>
                  The first 100 users to join will receive <br className="hidden md:block" />
                  <span className="font-bold text-[#4ade80] underline decoration-[#22c55e] decoration-2 underline-offset-4">
                    one month of our Sprout Plan for free.
                  </span>
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                  <CheckCircle2 className="w-6 h-6 text-[#4ade80] flex-shrink-0" />
                  <p className="text-sm font-bold uppercase tracking-wide">U.S. Only Marketplace</p>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                  <CheckCircle2 className="w-6 h-6 text-[#4ade80] flex-shrink-0" />
                  <p className="text-sm font-bold uppercase tracking-wide">Community to Community Sales</p>
                </div>
              </div>
            </div>

            {/* Right Column: Waitlist Card */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="w-full max-w-md bg-card rounded-[2.5rem] shadow-2xl overflow-hidden border border-border">
                <div className="p-8 sm:p-10">
                  <EmailForm />
                  <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    Secure & Private Signup
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prizes Metrics Bar */}
        <div className="relative w-full bg-primary/95 backdrop-blur-sm py-12 md:py-16 z-20 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h3 className="text-white text-lg md:text-4xl font-black uppercase tracking-[0.2em] drop-shadow-xl animate-fade-in-down">
                Win the Grand Prize Bundle
              </h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 items-start">
              {prizes.map((prize, idx) => (
                <div key={idx} className="flex flex-col items-center text-center md:border-r border-white/20 last:border-0 px-2 group">
                  <div className="w-28 h-28 md:w-28 md:h-28 rounded-full border-4 border-white/30 flex items-center justify-center mb-6 bg-white/5 overflow-hidden group-hover:bg-white/10 group-hover:scale-105 transition-all duration-300 shadow-xl">
                    <div className="relative w-full h-full">
                      <Image 
                        src={prize.imageUrl} 
                        alt={prize.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="text-white font-black text-lg md:text-xl tracking-tight leading-tight mb-2 px-2 h-auto md:h-14 flex items-center justify-center">
                    {prize.name}
                  </div>
                  <div className="text-primary-foreground/70 text-[10px] uppercase font-bold tracking-widest mt-1">
                    {prize.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Features Section */}
      <section className="w-full py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold font-headline text-primary mb-4">Built for Collectors, By Collectors</h2>
            <div className="w-24 h-1.5 bg-accent mx-auto rounded-full" />
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="group space-y-6 p-6 rounded-[2.5rem] hover:bg-muted/50 transition-all duration-500 border border-transparent hover:border-border">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] shadow-md group-hover:shadow-xl transition-all duration-500">
                <Image
                  src={placeholderImages.featureRareDiscovery.url}
                  alt={placeholderImages.featureRareDiscovery.alt}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                  data-ai-hint={placeholderImages.featureRareDiscovery.hint}
                />
              </div>
              <div className="space-y-4 px-2">
                <h3 className="text-2xl font-black font-headline text-primary">Rare Discovery</h3>
                <p className="text-muted-foreground leading-relaxed font-medium">
                  Connect with trusted U.S. growers to find species and supplies you won't find anywhere else. Our vetting process ensures quality for every transaction.
                </p>
              </div>
            </div>
            
            <div className="group space-y-6 p-6 rounded-[2.5rem] hover:bg-muted/50 transition-all duration-500 border border-transparent hover:border-border">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] shadow-md group-hover:shadow-xl transition-all duration-500">
                <Image
                  src={placeholderImages.featureCommunity.url}
                  alt={placeholderImages.featureCommunity.alt}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                  data-ai-hint={placeholderImages.featureCommunity.hint}
                />
              </div>
              <div className="space-y-4 px-2">
                <h3 className="text-2xl font-black font-headline text-primary">Vibrant Community</h3>
                <p className="text-muted-foreground leading-relaxed font-medium">
                  Join a growing community of enthusiasts. Share your passion, follow your favorite growers, and exchange knowledge within a dedicated botanical social network.
                </p>
              </div>
            </div>

            <div className="group space-y-6 p-6 rounded-[2.5rem] hover:bg-muted/50 transition-all duration-500 border border-transparent hover:border-border">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] shadow-md group-hover:shadow-xl transition-all duration-500">
                <Image
                  src={placeholderImages.featureSellerTools.url}
                  alt={placeholderImages.featureSellerTools.alt}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                  data-ai-hint={placeholderImages.featureSellerTools.hint}
                />
              </div>
              <div className="space-y-4 px-2">
                <h3 className="text-2xl font-black font-headline text-primary">Seller Tools</h3>
                <p className="text-muted-foreground leading-relaxed font-medium">
                  Reach a dedicated audience with a full suite of professional management tools. Track your finances, manage orders, create custom coupons, and more to grow your business.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-card py-16 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div className="space-y-4">
            <Image
              src="/sprout.png"
              alt="Sprout Logo"
              width={150}
              height={42}
              className="mx-auto md:mx-0"
            />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                &copy; 2026 Sprout Marketplace, LLC. All rights reserved.
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                Currently accepting waitlist sign-ups for U.S. Residents Only.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
              <Link href="https://www.instagram.com/sprout.marketplace/" target="_blank" rel="noopener noreferrer" className="p-3 bg-muted rounded-2xl hover:bg-primary hover:text-white transition-all">
                  <Instagram className="w-6 h-6" />
              </Link>
              <Link href="https://x.com/SproutMarketApp" target="_blank" rel="noopener noreferrer" className="p-3 bg-muted rounded-2xl hover:bg-primary hover:text-white transition-all">
                   <Twitter className="w-6 h-6" />
              </Link>
              <Link href="https://www.facebook.com/groups/762496292993718" target="_blank" rel="noopener noreferrer" className="p-3 bg-muted rounded-2xl hover:bg-primary hover:text-white transition-all">
                  <Facebook className="w-6 h-6" />
              </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
