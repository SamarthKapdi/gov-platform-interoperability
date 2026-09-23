import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-amber-500 text-white p-1.5 rounded text-sm font-bold leading-none tracking-wider">
                M
              </div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">MAHA-SETU</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Features</a>
              <a href="#architecture" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Architecture</a>
              <a href="#cta" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Join Now</a>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-slate-600 hover:text-slate-900 font-bold transition-colors">Sign In</Link>
              <Link to="/register" className="bg-slate-900 text-white px-5 py-2 rounded-full font-bold hover:bg-slate-800 transition-all transform hover:scale-105 shadow-md">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-100 rounded-full blur-3xl opacity-50 mix-blend-multiply pointer-events-none"></div>
            <div className="absolute top-40 right-0 w-[600px] h-[600px] bg-amber-100 rounded-full blur-3xl opacity-50 mix-blend-multiply pointer-events-none"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 mb-8 shadow-sm animate-fade-in-up">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Version 2.0 Live • SIH 26129</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
            The Future of <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-amber-500">
              Government Interoperability
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            MAHA-SETU bridges the gap between isolated departments. One identity, one portal, and absolute control over your data through fine-grained consent.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-full font-bold text-lg hover:bg-slate-800 transition-all transform hover:-translate-y-1 shadow-xl hover:shadow-2xl">
              Create Citizen Profile
            </Link>
            <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-full font-bold text-lg hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm">
              Citizen Login
            </Link>
          </div>
        </div>
      </section>

      {/* Trust / Stats Banner */}
      <div className="border-y border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-extrabold text-slate-900">3+</div>
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wide mt-1">Departments Linked</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900">Zero</div>
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wide mt-1">Data Duplication</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900">100%</div>
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wide mt-1">Consent Driven</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900">Event-Driven</div>
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wide mt-1">Real-time Architecture</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">A unified experience for the modern citizen.</h2>
            <p className="text-lg text-slate-600">Stop running between departments. MAHA-SETU connects the backend systems so you don't have to.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Golden Record</h3>
              <p className="text-slate-600 leading-relaxed">
                An intelligent Master Data Management (MDM) engine resolves your identity across isolated departments, providing a unified "Citizen 360" view without centralizing storage.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Explicit Consent</h3>
              <p className="text-slate-600 leading-relaxed">
                Your data is yours. Departments must request access to your records, and you can grant or revoke that access at any time through the centralized Consent Manager.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Unified Tracker</h3>
              <p className="text-slate-600 leading-relaxed">
                Track cross-departmental workflows in real-time. The Event Bus architecture instantly pushes updates to your dashboard as your application moves between agencies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section id="architecture" className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Enterprise-Grade Architecture</h2>
            <p className="text-lg text-slate-600">Built to handle population-scale data with zero compromises on security and reliability.</p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white font-bold">1</div>
                </div>
                <div className="ml-4">
                  <h4 className="text-xl font-bold text-slate-900">Event-Driven Microservices</h4>
                  <p className="mt-2 text-slate-600">Completely decoupled backend services communicate asynchronously via Redis Streams and Webhooks, ensuring high availability even if individual departments go offline.</p>
                </div>
              </div>
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-amber-500 text-white font-bold">2</div>
                </div>
                <div className="ml-4">
                  <h4 className="text-xl font-bold text-slate-900">Distributed Identity & MDM</h4>
                  <p className="mt-2 text-slate-600">No central honey-pot of data. The Master Data Management engine resolves fragmented identities dynamically using deterministic and probabilistic matching algorithms.</p>
                </div>
              </div>
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-500 text-white font-bold">3</div>
                </div>
                <div className="ml-4">
                  <h4 className="text-xl font-bold text-slate-900">Guaranteed Delivery (DLQ)</h4>
                  <p className="mt-2 text-slate-600">Built-in Dead Letter Queues automatically catch failed inter-departmental transactions, allowing automated retries and recovery when offline systems come back online.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-900 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%, #333), linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%, #333)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }}></div>
              <div className="relative z-10 font-mono text-sm">
                <div className="text-emerald-400 mb-2">// System Boot Sequence</div>
                <div className="text-slate-300 mb-1">$ mpm start:all</div>
                <div className="text-blue-400 mb-1">[GATEWAY] API Gateway running on port 3000</div>
                <div className="text-blue-400 mb-1">[IDENTITY] Identity service running on port 3020</div>
                <div className="text-amber-400 mb-1">[MDM] Resolver engine started...</div>
                <div className="text-emerald-400 mb-1">[WORKFLOW] State machine initialized</div>
                <div className="text-slate-400 mb-4">[EVENT-BUS] Connected to Redis stream</div>
                
                <div className="text-amber-400 mb-2">// Interoperability Handshake</div>
                <div className="text-slate-300">POST /api/workflow/instances</div>
                <div className="text-emerald-400 mb-4">{`{ "status": "201 Created", "id": "WF-9982" }`}</div>
                
                <div className="text-blue-400 mb-2">// Webhook Delivery</div>
                <div className="text-slate-300 mb-1">Delivering payload to DEPT_B...</div>
                <div className="text-emerald-400">ACK RECEIVED. Transitioning state.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="bg-slate-900 text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">Ready to experience seamless governance?</h2>
          <p className="text-xl text-slate-400 mb-10">Join the MAHA-SETU platform today and take control of your digital identity.</p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-amber-500 text-slate-900 rounded-full font-bold text-lg hover:bg-amber-400 transition-colors shadow-lg">
              Create an Account
            </Link>
            <a href="http://localhost:5174" className="w-full sm:w-auto px-8 py-4 bg-transparent border border-slate-700 text-white rounded-full font-bold text-lg hover:bg-slate-800 transition-colors">
              Go to Official Portal &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 text-center text-slate-500">
        <p className="font-bold text-slate-900 mb-2">MAHA-SETU</p>
        <p className="text-sm">Built for Smart India Hackathon 2026 (Problem 26129)</p>
      </footer>
    </div>
  );
}
