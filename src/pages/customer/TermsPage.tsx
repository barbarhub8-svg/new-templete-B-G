import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, ChevronDown, ChevronRight, Shield, Store,
  Users, IndianRupee, RotateCcw, AlertCircle, CheckCircle,
  Scale, Mail, ArrowLeft, Star, Home
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Section {
  id: string;
  icon: any;
  title: string;
  content: { heading?: string; body: string }[];
}

// ─── Sections ────────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    id: 'overview',
    icon: FileText,
    title: 'Overview & Acceptance',
    content: [
      {
        body: 'Welcome to Nexora Salonos ("Nexora", "we", "our", or "us"). These Terms and Conditions ("Terms") govern your use of our platform, website, and mobile application. By accessing or using Nexora, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our services.'
      },
      {
        heading: 'Effective Date',
        body: 'These Terms are effective as of January 1, 2025 and apply to all users, including customers, salon owners, and administrators.'
      },
      {
        heading: 'Amendments',
        body: 'Nexora reserves the right to modify these Terms at any time. We will notify registered users of significant changes via email. Continued use of the platform after changes constitutes your acceptance of the revised Terms.'
      },
    ],
  },
  {
    id: 'customer',
    icon: Users,
    title: 'Customer Agreement',
    content: [
      {
        heading: 'Eligibility',
        body: 'You must be at least 18 years old to make bookings on Nexora. By using the platform, you represent that you meet this age requirement and have the legal authority to enter into agreements.'
      },
      {
        heading: 'Booking Appointments',
        body: 'When you request an appointment, you are making a booking request to the salon. The booking is confirmed only when the salon owner accepts your request. Nexora acts as an intermediary platform and is not a party to the service agreement between you and the salon.'
      },
      {
        heading: 'Customer Responsibilities',
        body: 'You agree to: (a) provide accurate personal information including your name, email, and phone number; (b) arrive on time for confirmed appointments; (c) cancel appointments at least 2 hours in advance if unable to attend; (d) treat salon staff with respect and dignity; (e) make payments promptly for services rendered.'
      },
      {
        heading: 'Home Service Bookings',
        body: 'For home service appointments, you agree to ensure a safe and appropriate environment for the grooming professional. You confirm that the service address is within the salon\'s stated service radius. Additional charges for home service are clearly disclosed before booking and are non-negotiable.'
      },
      {
        heading: 'Accurate Information',
        body: 'Providing false or misleading information, including fake reviews or fraudulent bookings, will result in permanent suspension from the platform and may result in legal action.'
      },
    ],
  },
  {
    id: 'salon-owner',
    icon: Store,
    title: 'Salon Owner Agreement',
    content: [
      {
        heading: 'Registration & Verification',
        body: 'Salon owners must complete accurate registration and submit valid business documentation. All listings are subject to review and approval by Nexora\'s quality team. We reserve the right to reject or remove any listing that does not meet our standards.'
      },
      {
        heading: 'Service Quality Standards',
        body: 'As a registered salon owner, you agree to: (a) maintain high standards of service quality consistent with your listing; (b) employ trained and qualified professionals; (c) maintain a clean, hygienic, and safe premises; (d) deliver services exactly as advertised; (e) handle customer disputes professionally and promptly.'
      },
      {
        heading: 'Booking Management',
        body: 'You are required to: (a) respond to booking requests within 24 hours; (b) provide accurate availability and not double-book slots; (c) suggest alternative times only when genuinely unavailable; (d) mark bookings as completed only after services are fully delivered; (e) not cancel confirmed bookings without reasonable cause.'
      },
      {
        heading: 'Platform Commission',
        body: 'Nexora charges a commission of 10% on each completed booking\'s total service amount. This commission covers platform maintenance, customer acquisition, payment processing, and support services. Commissions are automatically deducted and reflected in your wallet balance.'
      },
      {
        heading: 'Prohibited Activities',
        body: 'Salon owners must not: (a) list services they are not qualified or equipped to provide; (b) solicit customers to bypass the Nexora platform; (c) manipulate review ratings through fake reviews or incentivized feedback; (d) engage in discrimination based on religion, caste, gender, or any other protected characteristic.'
      },
      {
        heading: 'Termination',
        body: 'Nexora may suspend or terminate a salon listing at its discretion for violations of these Terms, repeated customer complaints, failure to maintain quality standards, or any activity deemed harmful to the platform or its users.'
      },
    ],
  },
  {
    id: 'payment',
    icon: IndianRupee,
    title: 'Payment & Pricing Policy',
    content: [
      {
        heading: 'Service Pricing',
        body: 'Prices displayed on salon profiles are set by individual salon owners and may be subject to change. Nexora does not control or guarantee pricing accuracy. Always confirm the final price with the salon before your appointment.'
      },
      {
        heading: 'Payment Methods',
        body: 'Nexora supports payments via Nexora QR codes, which enable automatic reward tracking and cashback. Cash payments are accepted at the salon\'s discretion but may not qualify for cashback rewards. Third-party payment apps are handled independently between the customer and salon.'
      },
      {
        heading: 'Nexora Rewards & Cashback',
        body: 'Customers earn 2% reward balance (cashback) on completed bookings paid via Nexora QR. Rewards are credited automatically within 24 hours of booking completion. Reward balance cannot be withdrawn as cash, transferred to bank accounts, or redeemed for anything other than future Nexora bookings.'
      },
      {
        heading: 'Referral Program',
        body: 'A referral reward of ₹20 is credited to both the referrer and the new customer when: (a) the new customer uses a valid referral code at booking; (b) completes and pays for a booking of ₹100 or more. Fraudulent referrals will result in reward forfeiture and account suspension.'
      },
      {
        heading: 'Wallet Withdrawals (Owners)',
        body: 'Salon owners may request withdrawals of accumulated wallet balance. Minimum withdrawal amount is ₹100. Withdrawal requests are processed within 3–5 business days. Nexora reserves the right to hold payments pending verification for security purposes.'
      },
    ],
  },
  {
    id: 'refund',
    icon: RotateCcw,
    title: 'Cancellation & Refund Policy',
    content: [
      {
        heading: 'Customer Cancellations',
        body: 'Customers may cancel a confirmed booking up to 2 hours before the scheduled appointment time. Cancellations made within 2 hours of the appointment may be subject to a cancellation fee at the salon\'s discretion. No-shows without cancellation may result in temporary booking restrictions.'
      },
      {
        heading: 'Salon Cancellations',
        body: 'If a salon cancels a confirmed booking, customers will receive a full refund of any prepaid amounts. Repeated cancellations by salons may result in penalties or delisting from the platform.'
      },
      {
        heading: 'Refund Process',
        body: 'Refunds for prepaid bookings will be credited back to the original payment method within 5–7 business days. Reward balance used during a cancelled booking will be reinstated within 24 hours.'
      },
      {
        heading: 'Disputed Services',
        body: 'If you are dissatisfied with a service, contact the salon directly first. If unresolved, you may raise a dispute with Nexora Support within 48 hours of the appointment. Nexora will mediate but cannot guarantee refunds for completed services.'
      },
      {
        heading: 'Force Majeure',
        body: 'Nexora is not liable for cancellations or service failures arising from events beyond reasonable control, including natural disasters, government restrictions, power outages, or network failures.'
      },
    ],
  },
  {
    id: 'reviews',
    icon: Star,
    title: 'Reviews & Ratings',
    content: [
      {
        heading: 'Eligibility to Review',
        body: 'Only customers who have completed a verified booking may submit a review for that salon. Reviews are tied to specific bookings and cannot be submitted anonymously.'
      },
      {
        heading: 'Review Standards',
        body: 'Reviews must be honest, accurate, and based on your genuine experience. Reviews containing personal attacks, offensive language, discriminatory content, or unverified claims will be removed. Nexora reserves the right to moderate all review content.'
      },
      {
        heading: 'Prohibited Conduct',
        body: 'The following are strictly prohibited: (a) posting fake or incentivized reviews; (b) reviewing a service you did not receive; (c) coordinating multiple accounts to manipulate ratings; (d) using reviews to extort or threaten salons. Violations will result in account suspension.'
      },
      {
        heading: 'Review Removal',
        body: 'Nexora may remove reviews that violate our community standards, are demonstrably false, or are subject to legal dispute. Removal requests from salons are evaluated objectively by our moderation team.'
      },
    ],
  },
  {
    id: 'privacy',
    icon: Shield,
    title: 'Privacy & Data Protection',
    content: [
      {
        heading: 'Data Collection',
        body: 'Nexora collects personal information including your name, email address, phone number, and booking history to provide and improve our services. We do not sell your personal data to third parties.'
      },
      {
        heading: 'Data Usage',
        body: 'Your data is used to: (a) process and manage bookings; (b) send booking confirmations and reminders; (c) administer rewards and referral programs; (d) improve platform features and customer experience; (e) comply with legal obligations.'
      },
      {
        heading: 'Data Security',
        body: 'We implement industry-standard security measures including SSL/TLS encryption, secure password hashing, and row-level database security to protect your personal information from unauthorized access.'
      },
      {
        heading: 'Your Rights',
        body: 'You have the right to: access the personal data we hold about you; request correction of inaccurate data; request deletion of your data (subject to legal requirements); opt out of marketing communications. Contact us at hello@nexora.com to exercise these rights.'
      },
    ],
  },
  {
    id: 'liability',
    icon: Scale,
    title: 'Limitation of Liability',
    content: [
      {
        heading: 'Platform Role',
        body: 'Nexora is a technology platform that facilitates connections between customers and salon businesses. We are not a salon service provider and are not responsible for the quality, safety, or outcomes of services delivered by listed salons.'
      },
      {
        heading: 'Service Disputes',
        body: 'Any disputes regarding the quality of salon services are between the customer and the salon owner. Nexora may assist in mediation but bears no financial liability for unsatisfactory services.'
      },
      {
        heading: 'Maximum Liability',
        body: 'To the fullest extent permitted by applicable law, Nexora\'s total liability to you for any claim arising from use of the platform shall not exceed the total amount you have paid through the platform in the 3 months preceding the claim.'
      },
      {
        heading: 'Indemnification',
        body: 'You agree to indemnify and hold harmless Nexora, its officers, directors, employees, and agents from any claims, damages, or expenses arising from your violation of these Terms or misuse of the platform.'
      },
    ],
  },
  {
    id: 'contact',
    icon: Mail,
    title: 'Contact & Governing Law',
    content: [
      {
        heading: 'Governing Law',
        body: 'These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.'
      },
      {
        heading: 'Dispute Resolution',
        body: 'Before initiating legal proceedings, parties agree to attempt resolution through good-faith negotiation. If unresolved within 30 days, disputes may be submitted to binding arbitration under the Arbitration and Conciliation Act, 1996.'
      },
      {
        heading: 'Contact Information',
        body: 'For questions about these Terms, privacy concerns, or platform support, please contact us at:\n\nNexora Salonos Support\nEmail: hello@nexora.com\nResponse time: Within 24–48 business hours'
      },
    ],
  },
];

// ─── Section Component ────────────────────────────────────────────────────────

function TermsSection({ section, defaultOpen }: { section: Section; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const Icon = section.icon;

  return (
    <div id={section.id} className="nexora-card rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-4 p-6 text-left hover:bg-white/3 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-gold" />
        </div>
        <div className="flex-1">
          <h2 className="font-playfair font-bold text-white text-lg">{section.title}</h2>
          <p className="text-white/30 text-xs font-inter mt-0.5">{section.content.length} clause{section.content.length !== 1 ? 's' : ''}</p>
        </div>
        <ChevronDown className={`w-5 h-5 text-white/30 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-white/8 pt-5 space-y-5">
          {section.content.map((item, i) => (
            <div key={i}>
              {item.heading && (
                <h3 className="font-playfair font-semibold text-gold text-sm mb-2">{item.heading}</h3>
              )}
              <p className="text-white/50 text-sm font-inter leading-relaxed whitespace-pre-line">{item.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TermsPage() {
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);
  const [allOpen, setAllOpen] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10" ref={topRef}>

        {/* Back */}
        <button type="button" onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-gold transition-colors mb-8 font-inter">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gold/10 border-2 border-gold/25 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Scale className="w-8 h-8 text-gold" />
          </div>
          <div className="gold-divider w-12 mx-auto mb-6" />
          <h1 className="font-playfair font-bold text-white text-4xl sm:text-5xl mb-4">
            Terms & Conditions
          </h1>
          <p className="text-white/40 text-base font-inter max-w-xl mx-auto leading-relaxed">
            Please read these Terms carefully before using the Nexora Salonos platform. These terms protect both customers and salon owners.
          </p>
          <div className="flex items-center justify-center gap-2 mt-5">
            <span className="text-white/20 text-xs font-inter">Last updated:</span>
            <span className="text-white/40 text-xs font-inter font-semibold">January 1, 2025</span>
          </div>
        </div>

        {/* Quick nav */}
        <div className="nexora-card rounded-2xl p-6 mb-8">
          <p className="font-playfair font-semibold text-white mb-4">Quick Navigation</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SECTIONS.map(s => {
              const Icon = s.icon;
              return (
                <button key={s.id} type="button" onClick={() => scrollToSection(s.id)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/3 hover:bg-gold/8 border border-white/8 hover:border-gold/25 text-left transition-all group">
                  <Icon className="w-3.5 h-3.5 text-white/30 group-hover:text-gold transition-colors flex-shrink-0" />
                  <span className="text-white/50 group-hover:text-white text-xs font-inter transition-colors leading-tight">{s.title}</span>
                  <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-gold ml-auto flex-shrink-0 transition-colors" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Expand/Collapse all */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-white/30 text-sm font-inter">{SECTIONS.length} sections</p>
          <button type="button" onClick={() => setAllOpen(p => !p)}
            className="text-xs text-gold/70 hover:text-gold border border-gold/20 hover:border-gold/40 px-3 py-1.5 rounded-xl transition-all font-inter">
            {allOpen ? 'Collapse All' : 'Expand All'}
          </button>
        </div>

        {/* Sections */}
        <div className="space-y-3 mb-10">
          {SECTIONS.map((s, i) => (
            <TermsSection key={s.id} section={s} defaultOpen={allOpen || i === 0} />
          ))}
        </div>

        {/* Important highlights */}
        <div className="nexora-card rounded-2xl p-6 mb-8 border-gold/15">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-gold" />
            </div>
            <p className="font-playfair font-bold text-white">Key Points Summary</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { icon: Users, text: 'Customers must be 18+ and provide accurate info', color: 'text-blue-400' },
              { icon: Store, text: 'Salons pay 10% commission on completed bookings', color: 'text-gold' },
              { icon: IndianRupee, text: 'Rewards cannot be withdrawn as cash — salon use only', color: 'text-emerald-400' },
              { icon: RotateCcw, text: 'Cancellations must be made 2+ hours in advance', color: 'text-amber-400' },
              { icon: Star, text: 'Only verified bookers can leave reviews', color: 'text-gold' },
              { icon: Shield, text: 'Your data is encrypted and never sold to third parties', color: 'text-purple-400' },
              { icon: Scale, text: 'Disputes governed by Indian law, courts in Mumbai', color: 'text-rose-400' },
              { icon: Home, text: 'Home service address must be within salon\'s radius', color: 'text-teal-400' },
            ].map(({ icon: Icon, text, color }) => (
              <div key={text} className="flex items-start gap-2.5 p-3 bg-white/3 rounded-xl">
                <Icon className={`w-4 h-4 ${color} flex-shrink-0 mt-0.5`} />
                <p className="text-white/50 text-xs font-inter leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Acceptance Card */}
        <div className={`nexora-card rounded-2xl p-6 border-2 transition-all duration-300 ${accepted ? 'border-emerald-400/40 bg-emerald-400/3' : 'border-white/12'}`}>
          <button type="button" onClick={() => setAccepted(p => !p)}
            className="w-full flex items-start gap-4 text-left group">
            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 ${accepted ? 'bg-emerald-500 border-emerald-500' : 'border-white/25 group-hover:border-gold/50'}`}>
              {accepted && <CheckCircle className="w-4 h-4 text-white" />}
            </div>
            <div>
              <p className="font-playfair font-semibold text-white text-base mb-1">
                I have read and agree to the Terms & Conditions
              </p>
              <p className="text-white/35 text-sm font-inter leading-relaxed">
                By checking this box, you confirm that you have read, understood, and agree to be bound by all of the above Terms and Conditions, Privacy Policy, and community guidelines of Nexora Salonos.
              </p>
            </div>
          </button>

          {accepted && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-400/8 border border-emerald-400/20 rounded-xl">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p className="text-emerald-300 text-xs font-inter">
                Thank you for accepting our Terms. You can now fully enjoy all Nexora services.
              </p>
            </div>
          )}

          <div className={`mt-5 flex flex-col sm:flex-row gap-3 ${!accepted ? 'opacity-50 pointer-events-none' : ''}`}>
            <button type="button" onClick={() => navigate('/')}
              className="flex-1 py-3 rounded-xl bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold text-sm shadow-gold transition-all font-inter">
              Explore Salons →
            </button>
            <button type="button" onClick={() => navigate('/owner/register')}
              className="flex-1 py-3 rounded-xl border border-gold/30 text-gold hover:bg-gold/5 hover:border-gold font-semibold text-sm transition-all font-inter">
              Register Your Salon →
            </button>
          </div>
        </div>

        {/* Contact strip */}
        <div className="text-center mt-10 pb-4">
          <p className="text-white/20 text-xs font-inter">
            Questions about these terms? Email us at{' '}
            <a href="mailto:hello@nexora.com" className="text-gold/50 hover:text-gold transition-colors">
              hello@nexora.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
