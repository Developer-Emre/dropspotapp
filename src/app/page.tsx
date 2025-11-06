// ============================================
// HOME PAGE - LANDING PAGE
// ============================================

import Navigation from '@/components/layout/Navigation'
import HeroSection from '@/components/landing/HeroSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import CTASection from '@/components/landing/CTASection'

export default function Home() {
  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">
      <Navigation />
      <main className="relative z-10 w-full">
        <HeroSection />
        <FeaturesSection />
        <CTASection />
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-3 sm:px-4 w-full">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">D</span>
                </div>
                <span className="text-xl font-bold">DropSpot</span>
              </div>
              <p className="text-gray-400 max-w-md">
                The ultimate platform for discovering and claiming exclusive drops. Join thousands of users in the drop revolution.
              </p>
            </div>
            
            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
                <li><a href="/drops" className="hover:text-white transition-colors">Drops</a></li>
                <li><a href="/about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            {/* Support */}
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/help" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="/faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 DropSpot. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
