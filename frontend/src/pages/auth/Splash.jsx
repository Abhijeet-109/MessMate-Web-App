import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, ChevronRight, UtensilsCrossed, Smartphone, MapPin, Search, Star, CreditCard, Bell, LayoutDashboard, Send, Users, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { useTheme } from '../../context/ThemeContext';

const Splash = () => {
  const navigate = useNavigate();
  const { setForceLight } = useTheme();

  // Force Light Mode
  useEffect(() => {
    setForceLight(true);
    return () => setForceLight(false);
  }, [setForceLight]);

  return (
    <div className="min-h-screen bg-background font-sans text-on-surface overflow-x-hidden selection:bg-primary/20 selection:text-primary-dark">

      {/* SECTION 1 - NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-outline-variant shadow-sm transition-all duration-300">
        <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6 text-primary-dark" />
            </div>
            <span className="text-headline-md font-extrabold text-primary-dark tracking-tight">MessMate</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-body-md font-bold text-on-surface-variant hover:text-primary transition-colors">How It Works</a>
            <a href="#features" className="text-body-md font-bold text-on-surface-variant hover:text-primary transition-colors">Features</a>
            <a href="#about" className="text-body-md font-bold text-on-surface-variant hover:text-primary transition-colors">About Us</a>
            <a href="#contact" className="text-body-md font-bold text-on-surface-variant hover:text-primary transition-colors">Contact</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/student/login')}
              className="px-6 py-2.5 rounded-pill border-2 border-outline-variant text-on-surface font-bold hover:border-primary hover:text-primary transition-all hidden sm:block"
            >
              Student Portal
            </button>
            <button
              onClick={() => navigate('/admin/login')}
              className="px-6 py-2.5 rounded-pill bg-primary text-white font-bold hover:bg-primary-dark transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              Owner Login
            </button>
          </div>
        </div>
      </nav>

      {/* SECTION 2 - HERO */}
      <section className="relative pt-2 pb-16 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 -z-10"></div>

        <div className="max-w-[1200px] mx-auto px-6 flex flex-col lg:flex-row items-center gap-16 relative z-10">

          <div className="flex-1 flex flex-col items-start text-left">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-pill shadow-sm border border-outline-variant mb-4 animate-fade-in">
              <span className="text-lg">🍱</span>
              <span className="text-label-md font-bold text-on-surface tracking-wide uppercase">Built for Indian Students</span>
            </div>

            <h1 className="text-[48px] md:text-[64px] font-extrabold text-[#0B1A30] leading-[1.1] mb-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
              Skip the Wait.<br />
              <span className="text-primary relative inline-block">
                Pre-Order Your Meal
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 10C80 2 220 2 298 10" stroke="#E8752A" strokeWidth="4" strokeLinecap="round" opacity="0.3" />
                </svg>
              </span><br />
              Before You Arrive.
            </h1>

            <p className="text-body-lg md:text-[20px] text-on-surface-variant max-w-xl mb-6 leading-relaxed animate-slide-up" style={{ animationDelay: '200ms' }}>
              MessMate lets students pre-book meals from local mess services while on the way. Food is ready the moment you walk in. No more standing in line.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-slide-up" style={{ animationDelay: '300ms' }}>
              <button
                onClick={() => navigate('/student/login')}
                className="px-8 py-4 rounded-pill bg-primary text-white font-bold text-lg hover:bg-primary-dark transition-all hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2 group"
              >
                Get Started as Student
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/admin/login')}
                className="px-8 py-4 rounded-pill bg-white border-2 border-outline-variant text-on-surface font-bold text-lg hover:border-primary hover:text-primary transition-all flex items-center justify-center"
              >
                I'm a Mess Owner
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-6 mt-6 pt-4 border-t border-outline-variant animate-slide-up" style={{ animationDelay: '400ms' }}>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-warning text-warning" />
                <span className="font-bold text-on-surface">500+ Students</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🏠</span>
                <span className="font-bold text-on-surface">50+ Mess Partners</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <span className="font-bold text-on-surface">Avg 25 min saved/meal</span>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full max-w-[400px] lg:max-w-none relative flex justify-center animate-fade-in" style={{ animationDelay: '300ms' }}>
            {/* Phone Mockup Frame */}
            <div className="relative w-[320px] h-[650px] bg-[#121212] rounded-[48px] border-[12px] border-[#1A1A1A] shadow-2xl overflow-hidden shadow-primary/20">
              <div className="absolute top-0 inset-x-0 h-6 bg-[#1A1A1A] rounded-b-[24px] w-40 mx-auto z-20"></div>

              <div className="absolute inset-0 bg-background flex flex-col p-4 pt-12">
                <div className="bg-gradient-to-r from-primary to-[#F69E52] p-4 rounded-xl text-white mb-4 relative overflow-hidden shadow-md">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Annapurna Mess Pass</span>
                  <div className="text-[32px] font-extrabold leading-none mt-1">18</div>
                  <span className="text-[12px] opacity-90">Meals Remaining</span>
                  <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white opacity-10 rounded-full blur-md"></div>
                </div>

                <h3 className="font-bold text-on-surface mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-warning" /> Active Order</h3>

                <div className="bg-surface p-4 rounded-xl shadow-sm border border-outline-variant flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-on-surface">Annapurna Mess</h4>
                      <p className="text-[12px] text-on-surface-variant">Dine-in • 1:30 PM</p>
                    </div>
                    <span className="bg-primary-container text-primary-dark px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">Preparing</span>
                  </div>

                  <div className="flex justify-between items-center relative mt-2">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-outline-variant -translate-y-1/2"></div>
                    <div className="absolute top-1/2 left-0 w-1/2 h-0.5 bg-primary -translate-y-1/2"></div>

                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center z-10"><CheckCircle2 className="w-4 h-4 text-white" /></div>
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center z-10"><CheckCircle2 className="w-4 h-4 text-white" /></div>
                    <div className="w-6 h-6 rounded-full bg-surface border-2 border-outline-variant z-10"></div>
                    <div className="w-6 h-6 rounded-full bg-surface border-2 border-outline-variant z-10"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Glowing Accent */}
            <div className="absolute inset-0 bg-primary opacity-20 blur-[80px] -z-10 rounded-full scale-75"></div>
          </div>
        </div>
      </section>

      {/* SECTION 3 - HOW IT WORKS */}
      <section id="how-it-works" className="py-24 bg-surface-container relative">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <h2 className="text-[36px] md:text-[48px] font-extrabold text-[#0B1A30] mb-4">How MessMate Works</h2>
          <p className="text-body-lg text-on-surface-variant mb-16 max-w-2xl mx-auto">Three simple steps to never wait for food again.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Dashed Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 border-t-2 border-dashed border-primary/30 z-0"></div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-outline-variant relative z-10 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-20 h-20 bg-primary-container rounded-full mx-auto flex items-center justify-center mb-6 shadow-inner">
                <Search className="w-10 h-10 text-primary-dark" />
              </div>
              <h3 className="text-headline-md font-bold text-on-surface mb-3"><span className="text-primary mr-2">1.</span> Browse & Select</h3>
              <p className="text-body-md text-on-surface-variant">Open MessMate, find your mess, and pick today's menu items.</p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-outline-variant relative z-10 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-20 h-20 bg-primary-container rounded-full mx-auto flex items-center justify-center mb-6 shadow-inner">
                <Clock className="w-10 h-10 text-primary-dark" />
              </div>
              <h3 className="text-headline-md font-bold text-on-surface mb-3"><span className="text-primary mr-2">2.</span> Choose Your Slot</h3>
              <p className="text-body-md text-on-surface-variant">Select a time slot that matches when you'll arrive. Slots fill up fast!</p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-outline-variant relative z-10 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-20 h-20 bg-primary-container rounded-full mx-auto flex items-center justify-center mb-6 shadow-inner">
                <CheckCircle2 className="w-10 h-10 text-primary-dark" />
              </div>
              <h3 className="text-headline-md font-bold text-on-surface mb-3"><span className="text-primary mr-2">3.</span> Arrive & Eat</h3>
              <p className="text-body-md text-on-surface-variant">Your food is ready when you walk in. Pay online or at the counter.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 - FEATURES */}
      <section id="features" className="py-24 bg-background">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <h2 className="text-[36px] md:text-[48px] font-extrabold text-[#0B1A30] mb-4">Everything You Need</h2>
          <p className="text-body-lg text-on-surface-variant mb-16 max-w-2xl mx-auto">Designed for students. Built for mess owners.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {[
              { icon: Clock, title: "Pre-Order Anytime", desc: "Book your meal up to 2 hours before your slot. Food prep starts automatically." },
              { icon: Smartphone, title: "Monthly Meal Pass", desc: "Subscribe to a mess for the month. Track meals, manage attendance, no daily payment hassle." },
              { icon: UtensilsCrossed, title: "Dine-in or Parcel", desc: "Choose to eat at the mess or get a packed parcel to take home." },
              { icon: CreditCard, title: "Easy Payments", desc: "Pay via UPI, GPay, PhonePe, or cards through Razorpay. No cash needed." },
              { icon: Bell, title: "Live Order Updates", desc: "Know exactly when your food is Accepted → Preparing → Ready." },
              { icon: Star, title: "Rate Your Meals", desc: "Rate individual dishes after every order. Help others find the best mess in town." },
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[24px] shadow-sm border border-outline-variant hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 bg-primary-container rounded-full flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-primary-dark" />
                </div>
                <h3 className="text-headline-md font-bold text-on-surface mb-3">{feature.title}</h3>
                <p className="text-body-md text-on-surface-variant leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 - FOR MESS OWNERS */}
      <section className="py-24 bg-secondary text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col lg:flex-row items-center gap-16 relative z-10">

          <div className="flex-1">
            <span className="inline-block bg-white/20 px-3 py-1 rounded-md text-[12px] font-bold uppercase tracking-widest mb-6">For Mess Owners</span>
            <h2 className="text-[36px] md:text-[48px] font-extrabold mb-8 leading-tight">Run Your Mess Smarter</h2>

            <ul className="flex flex-col gap-4 mb-10">
              {[
                "Live order queue — accept or reject instantly",
                "Auto-calculate student bills",
                "Manage daily menu in seconds",
                "Track subscriber attendance",
                "Set slot capacity — no overbooking",
                "Revenue dashboard with daily summary"
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-lg text-white/90">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate('/admin/login')}
              className="px-8 py-4 rounded-pill bg-primary text-white font-bold text-lg hover:bg-primary-dark transition-all hover:shadow-lg hover:-translate-y-1"
            >
              Register Your Mess
            </button>
          </div>

          <div className="flex-1 w-full max-w-[600px] flex justify-center">
            {/* Laptop/Dashboard Mockup */}
            <div className="w-full bg-[#1A1A1A] p-2 rounded-t-[16px] shadow-2xl relative">
              <div className="w-full bg-surface rounded-[8px] overflow-hidden aspect-[16/10] flex flex-col">
                <div className="h-4 bg-surface-container border-b border-outline-variant flex items-center gap-1.5 px-3">
                  <div className="w-2 h-2 rounded-full bg-error"></div>
                  <div className="w-2 h-2 rounded-full bg-warning"></div>
                  <div className="w-2 h-2 rounded-full bg-success"></div>
                </div>
                <div className="p-4 flex flex-col gap-4 bg-[#F0F0F0] h-full">
                  <div className="bg-secondary text-white p-4 rounded-xl shadow-sm">
                    <span className="text-[10px] uppercase tracking-widest opacity-80">Today's Revenue</span>
                    <div className="text-2xl font-bold">₹12,500</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-outline-variant flex items-center gap-2">
                      <div className="bg-primary/20 p-2 rounded-full"><Users className="w-4 h-4 text-primary-dark" /></div>
                      <div>
                        <div className="font-bold text-on-surface leading-none text-lg">142</div>
                        <div className="text-[10px] text-on-surface-variant">Active Subs</div>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-outline-variant flex items-center gap-2">
                      <div className="bg-success/20 p-2 rounded-full"><UtensilsCrossed className="w-4 h-4 text-success" /></div>
                      <div>
                        <div className="font-bold text-on-surface leading-none text-lg">85</div>
                        <div className="text-[10px] text-on-surface-variant">Orders</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-white p-2 rounded-xl text-center text-[12px] font-bold text-on-surface shadow-sm border border-outline-variant">Manage Slots</div>
                    <div className="flex-1 bg-white p-2 rounded-xl text-center text-[12px] font-bold text-on-surface shadow-sm border border-outline-variant">Update Menu</div>
                  </div>
                </div>
              </div>
              <div className="h-4 bg-[#2A2A2A] rounded-b-[16px] w-full mt-2 -ml-2 -mr-2 px-4 shadow-xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 - ABOUT US */}
      <section id="about" className="py-24 bg-background">
        <div className="max-w-[700px] mx-auto px-6 text-center">
          <h2 className="text-[36px] font-extrabold text-[#0B1A30] mb-8">Why We Built MessMate</h2>
          <p className="text-body-lg text-on-surface-variant leading-relaxed mb-10 text-justify md:text-center">
            As students ourselves, we know the frustration of rushing to the mess after college, only to wait 20-30 minutes for food to be prepared. MessMate was built to solve this — a simple, fast app that connects students with their local mess and eliminates the wait entirely.
          </p>
          <div className="inline-flex items-center gap-3 bg-surface-container px-6 py-3 rounded-pill">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="font-bold text-on-surface">Built by MCA students. Designed for Indian college life.</span>
          </div>
        </div>
      </section>

      {/* SECTION 7 - CONTACT */}
      <section id="contact" className="py-24 bg-surface-container">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row gap-16">

          <div className="flex-1">
            <h2 className="text-[36px] font-extrabold text-[#0B1A30] mb-8">Get in Touch</h2>
            <div className="flex flex-col gap-6 mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-xl">📧</div>
                <div>
                  <div className="text-label-md text-on-surface-variant uppercase tracking-wider">Email</div>
                  <div className="font-bold text-on-surface text-lg">hello@messmate.app</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-xl">📱</div>
                <div>
                  <div className="text-label-md text-on-surface-variant uppercase tracking-wider">Phone</div>
                  <div className="font-bold text-on-surface text-lg">+91 98765 43210</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-xl">📍</div>
                <div>
                  <div className="text-label-md text-on-surface-variant uppercase tracking-wider">Location</div>
                  <div className="font-bold text-on-surface text-lg">Pune, Maharashtra, India</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="w-12 h-12 rounded-full border-2 border-outline-variant flex items-center justify-center hover:border-primary hover:text-primary transition-colors font-bold">IG</button>
              <button className="w-12 h-12 rounded-full border-2 border-outline-variant flex items-center justify-center hover:border-primary hover:text-primary transition-colors font-bold">IN</button>
              <button className="w-12 h-12 rounded-full border-2 border-outline-variant flex items-center justify-center hover:border-primary hover:text-primary transition-colors font-bold">GH</button>
            </div>
          </div>

          <div className="flex-1">
            <form className="bg-white p-8 rounded-[24px] shadow-sm border border-outline-variant flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-label-md font-bold text-on-surface-variant">Name</label>
                <input type="text" placeholder="John Doe" className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant bg-surface focus:border-primary outline-none transition-colors" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-label-md font-bold text-on-surface-variant">Email</label>
                <input type="email" placeholder="john@example.com" className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant bg-surface focus:border-primary outline-none transition-colors" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-label-md font-bold text-on-surface-variant">Message</label>
                <textarea rows="4" placeholder="How can we help?" className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant bg-surface focus:border-primary outline-none transition-colors resize-none"></textarea>
              </div>
              <button type="button" className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 mt-2">
                <Send className="w-5 h-5" /> Send Message
              </button>
            </form>
          </div>

        </div>
      </section>

      {/* SECTION 8 - FOOTER */}
      <footer className="bg-[#0B1A30] py-12 text-white">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-6 h-6 text-primary" />
              <span className="text-headline-md font-extrabold tracking-tight">MessMate</span>
            </div>
            <p className="text-white/60 text-body-md">Your Meal, Ready When You Are</p>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            <a href="#features" className="text-body-md text-white/80 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-body-md text-white/80 hover:text-white transition-colors">How It Works</a>
            <button onClick={() => navigate('/student/login')} className="text-body-md text-white/80 hover:text-white transition-colors">Student Login</button>
            <button onClick={() => navigate('/admin/login')} className="text-body-md text-white/80 hover:text-white transition-colors">Owner Login</button>
          </div>

          <div className="text-white/40 text-label-md">
            © 2026 MessMate. Built with ❤️ in India
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Splash;
