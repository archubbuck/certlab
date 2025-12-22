import { useState, lazy, Suspense, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  GraduationCap,
  ArrowRight,
  Brain,
  Shield,
  BookOpen,
  Menu,
  X,
  Target,
  Zap,
  Trophy,
  TrendingUp,
  Users,
  Star,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-provider';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Lazy load Login component to reduce initial bundle size
const Login = lazy(() => import('./login'));

// Features data - Enhanced with more details
const features = [
  {
    title: 'Adaptive Learning',
    description:
      'AI-powered system adapts to your learning pace and identifies knowledge gaps automatically.',
    icon: Brain,
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    title: 'Smart Progress Tracking',
    description:
      'Visualize your journey with detailed analytics and insights into your performance.',
    icon: TrendingUp,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Personalized Lectures',
    description: 'AI generates custom lectures based on your weak topics and learning style.',
    icon: BookOpen,
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    title: 'Practice Tests',
    description:
      'Realistic exam simulations to build confidence and identify areas for improvement.',
    icon: Target,
    gradient: 'from-orange-500 to-red-500',
  },
  {
    title: 'Fast & Efficient',
    description:
      'Study smarter, not harder. Our platform optimizes your study time for maximum retention.',
    icon: Zap,
    gradient: 'from-yellow-500 to-orange-500',
  },
  {
    title: 'Achievement System',
    description: 'Earn badges and track milestones to stay motivated throughout your journey.',
    icon: Trophy,
    gradient: 'from-indigo-500 to-purple-500',
  },
];

// Stats data
const stats = [
  { value: '10K+', label: 'Active Learners' },
  { value: '95%', label: 'Pass Rate' },
  { value: '500K+', label: 'Questions Answered' },
  { value: '4.9/5', label: 'User Rating' },
];

// Testimonials data
const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Security Analyst',
    content:
      'CertLab helped me pass my CISSP on the first try. The adaptive learning really made a difference.',
    rating: 5,
  },
  {
    name: 'Michael Rodriguez',
    role: 'IT Manager',
    content:
      "The best certification prep platform I've used. The AI-powered lectures filled in my knowledge gaps perfectly.",
    rating: 5,
  },
  {
    name: 'Emily Watson',
    role: 'Cybersecurity Consultant',
    content:
      'I love the progress tracking and achievement system. It kept me motivated throughout my CISM preparation.',
    rating: 5,
  },
];

// FAQ data
const faqs = [
  {
    question: 'What certifications does CertLab support?',
    answer:
      'CertLab currently supports CISSP and CISM certifications, with more being added regularly. Our platform is designed to help you master these industry-leading security certifications.',
  },
  {
    question: 'How does the adaptive learning work?',
    answer:
      'Our AI analyzes your quiz performance in real-time, identifying knowledge gaps and adjusting question difficulty. This ensures you spend more time on topics you need to improve while reinforcing your strengths.',
  },
  {
    question: 'Can I use CertLab on mobile devices?',
    answer:
      'Yes! CertLab is fully responsive and works on all devices. Study on your desktop at home and continue on your phone during your commute.',
  },
  {
    question: 'Is there a free trial available?',
    answer:
      'Absolutely! You can create a free account and access our core features. No credit card required to get started.',
  },
  {
    question: 'How long does it take to prepare for a certification?',
    answer:
      'It varies by individual and certification, but most users spend 2-3 months preparing with CertLab. Our adaptive system helps optimize your study time based on your current knowledge level.',
  },
];

export default function Landing() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-redirect authenticated users to the app
  useEffect(() => {
    if (isAuthenticated && !showLogin) {
      navigate('/app', { replace: true });
    }
  }, [isAuthenticated, showLogin, navigate]);

  const handleLogin = useCallback(() => {
    setShowLogin(true);
  }, []);

  const handleGoToDashboard = useCallback(() => {
    navigate('/app');
  }, [navigate]);

  const handleScrollToFeatures = useCallback(() => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  }, []);

  const handleScrollToFaq = useCallback(() => {
    document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  }, []);

  const handleToggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const getUserDisplayName = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) return user.firstName;
    if (user?.lastName) return user.lastName;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  if (showLogin) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-black flex items-center justify-center">
            <LoadingSpinner size="lg" label="Loading login..." />
          </div>
        }
      >
        <Login />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="py-4 px-4 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50 border-b border-white/5">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-lg blur-lg opacity-75 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-slate-900 p-2 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                CertLab
              </span>
            </div>
            <button
              className="border border-white/20 size-10 inline-flex justify-center items-center rounded-lg md:hidden hover:bg-white/5 transition-colors"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              onClick={handleToggleMobileMenu}
            >
              {mobileMenuOpen ? (
                <X className="text-white w-5 h-5" />
              ) : (
                <Menu className="text-white w-5 h-5" />
              )}
            </button>
            <nav className="text-white/70 items-center gap-6 hidden md:flex">
              <button
                onClick={handleScrollToFeatures}
                className="hover:text-white transition duration-300 font-medium"
              >
                Features
              </button>
              <button
                onClick={handleScrollToFaq}
                className="hover:text-white transition duration-300 font-medium"
              >
                FAQ
              </button>
              {isAuthenticated ? (
                <button
                  onClick={handleGoToDashboard}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 py-2.5 px-6 rounded-lg text-white font-semibold shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/40"
                  data-testid="dashboard-button"
                >
                  Dashboard
                </button>
              ) : (
                <button
                  onClick={handleLogin}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 py-2.5 px-6 rounded-lg text-white font-semibold shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/40"
                  data-testid="get-started-button"
                >
                  Get Started
                </button>
              )}
            </nav>
          </div>
          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div id="mobile-menu" className="md:hidden mt-4 py-4 border-t border-white/10">
              <div className="flex flex-col gap-4">
                <button
                  onClick={handleScrollToFeatures}
                  className="text-white/70 hover:text-white transition duration-300 text-left font-medium"
                >
                  Features
                </button>
                <button
                  onClick={handleScrollToFaq}
                  className="text-white/70 hover:text-white transition duration-300 text-left font-medium"
                >
                  FAQ
                </button>
                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      handleGoToDashboard();
                      setMobileMenuOpen(false);
                    }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 py-2.5 px-6 rounded-lg text-white font-semibold text-center"
                  >
                    Dashboard
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleLogin();
                      setMobileMenuOpen(false);
                    }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 py-2.5 px-6 rounded-lg text-white font-semibold text-center"
                  >
                    Get Started
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-cyan-600/20" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-2000" />
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="flex items-center justify-center mb-8">
            <div
              className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 py-2 px-4 rounded-full hover:bg-white/10 transition-all cursor-pointer group"
              onClick={handleScrollToFeatures}
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent font-medium">
                AI-Powered Adaptive Learning
              </span>
              <ArrowRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div className="flex justify-center">
            <div className="max-w-5xl text-center">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
                <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                  Master Your
                </span>
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  Certifications
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto mb-10 leading-relaxed">
                The intelligent learning platform that adapts to you. Pass{' '}
                <span className="text-purple-400 font-semibold">CISSP</span>,{' '}
                <span className="text-pink-400 font-semibold">CISM</span>, and other professional
                certifications with confidence.
              </p>

              {isAuthenticated ? (
                <div className="flex flex-col items-center gap-4">
                  <p className="text-white/80 text-lg">Welcome back, {getUserDisplayName(user)}!</p>
                  <button
                    onClick={handleGoToDashboard}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-4 px-10 rounded-xl font-bold text-lg shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 transform hover:scale-105 transition-all inline-flex items-center gap-2"
                    data-testid="hero-dashboard-button"
                  >
                    Continue Learning
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button
                    onClick={handleLogin}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-4 px-10 rounded-xl font-bold text-lg shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 transform hover:scale-105 transition-all inline-flex items-center gap-2"
                    data-testid="hero-get-started-button"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleScrollToFeatures}
                    className="bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/20 text-white py-4 px-10 rounded-xl font-bold text-lg transition-all inline-flex items-center gap-2"
                  >
                    Learn More
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-sm border-y border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-white/60 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="bg-purple-500/10 border border-purple-500/20 text-purple-300 px-4 py-1.5 rounded-full text-sm font-semibold">
                Features
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Everything you need
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                to succeed
              </span>
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Powerful features designed to accelerate your certification journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ title, description, icon: Icon, gradient }) => (
              <div
                key={title}
                className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div
                    className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${gradient} mb-5 shadow-lg`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
                  <p className="text-white/60 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-purple-950/20 to-pink-950/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="bg-pink-500/10 border border-pink-500/20 text-pink-300 px-4 py-1.5 rounded-full text-sm font-semibold">
                Testimonials
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Loved by learners
              </span>
              <br />
              <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                worldwide
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-white/80 mb-6 leading-relaxed">
                  &quot;{testimonial.content}&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-white/60">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Ready to ace your
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                certification exam?
              </span>
            </h2>
            <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
              Join thousands of successful learners who have mastered their certifications with
              CertLab&apos;s AI-powered platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              {isAuthenticated ? (
                <button
                  onClick={handleGoToDashboard}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-4 px-10 rounded-xl font-bold text-lg shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 transform hover:scale-105 transition-all inline-flex items-center justify-center gap-2"
                >
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleLogin}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-4 px-10 rounded-xl font-bold text-lg shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 transform hover:scale-105 transition-all inline-flex items-center justify-center gap-2"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>Free forever plan</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 md:py-32 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 px-4 py-1.5 rounded-full text-sm font-semibold">
                FAQ
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Frequently asked
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                questions
              </span>
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-6 hover:bg-white/10 transition-colors"
                >
                  <AccordionTrigger className="text-left py-6 text-white hover:no-underline font-semibold">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-white/70 pb-6 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white/60 py-12 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:justify-between gap-8 mb-8">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-lg blur-lg opacity-75" />
                <div className="relative bg-slate-900 p-2 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                CertLab
              </span>
            </div>
            <div className="flex flex-wrap gap-6">
              <button
                onClick={handleScrollToFeatures}
                className="hover:text-white transition duration-200 font-medium"
              >
                Features
              </button>
              <button
                onClick={handleScrollToFaq}
                className="hover:text-white transition duration-200 font-medium"
              >
                FAQ
              </button>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 text-center md:text-left">
            <p className="select-none">
              © {new Date().getFullYear()} CertLab. All rights reserved. Built with AI-powered
              learning technology.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
