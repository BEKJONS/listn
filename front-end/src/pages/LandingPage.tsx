import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { SearchIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { ProfileCard } from '../components/ProfileCard';

export function LandingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [topProfiles, setTopProfiles] = useState<any[]>([]);
  const [similarListeners, setSimilarListeners] = useState<any[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    // Fetch Top Profiles
    fetch('/api/top_profiles')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTopProfiles(data
            .filter((u: any) => u && (u.customUrl || u.username)) // Filter out invalid entries
            .map((u: any) => ({
              name: u.displayName || u.username || 'Unknown',
              role: u.roleTitle || 'Music Lover',
              visitCount: u.views || 0,
              username: u.customUrl || u.username || ''
            })));
        }
      })
      .catch((err) => {
        console.error('Error fetching top profiles:', err);
      });

    // Check Login Status and fetch Similar Listeners
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setIsLoggedIn(true);
          setUserProfile(data.user);

          // Fetch similar listeners if logged in
          fetch('/api/similar_listeners')
            .then(res => res.json())
            .then(simData => {
              if (Array.isArray(simData)) {
                setSimilarListeners(simData
                  .filter((u: any) => u && (u.customUrl || u.username)) // Filter out invalid entries
                  .map((u: any) => ({
                    name: u.displayName || u.username || 'Unknown',
                    role: u.roleTitle || 'Music Lover',
                    visitCount: u.views || 0,
                    username: u.customUrl || u.username || ''
                  })));
              }
            })
            .catch((err) => {
              console.error('Error fetching similar listeners:', err);
            });
        }
      })
      .catch(() => {
        setIsLoggedIn(false);
        setUserProfile(null);
      });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/u/${searchQuery.trim()}`);
    }
  };
  return (
    <main className="min-h-screen w-full bg-black">
      {/* Header */}
      <motion.header
        initial={{
          opacity: 0,
          y: -20
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        transition={{
          duration: 0.5
        }}
        className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-4">

        <nav className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-white font-bold text-xl">
            Listn
          </Link>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Button variant="secondary" onClick={() => navigate(`/u/${userProfile?.customUrl || userProfile?.username || ''}`)}>
                  View Public Profile
                </Button>
                <Button variant="primary" onClick={() => navigate('/dashboard')}>
                  Dashboard
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button variant="primary" onClick={() => navigate('/login')}>
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </nav>
      </motion.header>

      {/* Hero Section */}
      <section className="pt-32 md:pt-40 pb-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h1
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              duration: 0.6,
              delay: 0.2
            }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-gray-300 mb-6">

            Listn
          </motion.h1>

          <motion.p
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              duration: 0.6,
              delay: 0.3
            }}
            className="text-gray-500 text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed">

            The most minimalistic way to share your Yandex Music taste. Create
            your profile, add your favorite tracks, and let others hear what
            you're listening to.
          </motion.p>

          {/* Search Bar */}
          <motion.form
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              duration: 0.6,
              delay: 0.4
            }}
            onSubmit={handleSearch}
            className="max-w-lg mx-auto">

            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter username or custom URL to search..."
                className="
                  w-full bg-white/[0.03] border border-white/[0.08] rounded-full
                  pl-12 pr-6 py-4 text-white placeholder-gray-500
                  focus:outline-none focus:border-white/20
                  transition-all duration-200
                " />

            </div>
          </motion.form>
        </div>
      </section>

      {/* Similar Listeners Section (Only if logged in and data exists) */}
      {isLoggedIn && similarListeners.length > 0 && (
        <section className="py-8 px-4">
          <div className="max-w-2xl mx-auto">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center text-xs tracking-[0.3em] text-gray-500 mb-8">
              SIMILAR LISTENERS
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {similarListeners.map((profile, index) =>
                <ProfileCard key={profile.username} {...profile} index={index} />
              )}
            </div>
          </div>
        </section>
      )}

      {/* Top Visited Profiles */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.h2
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            transition={{
              delay: 0.5
            }}
            className="text-center text-xs tracking-[0.3em] text-gray-500 mb-8">

            TOP VISITED PROFILES
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topProfiles.map((profile, index) =>
              <ProfileCard key={profile.username} {...profile} index={index} />
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <motion.footer
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}
        transition={{
          delay: 0.7
        }}
        className="border-t border-white/[0.06] py-12 px-4 mt-16">

        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-600 text-sm mb-4">
            © 2026 Listn Music. Music connects us all.
          </p>
          <div className="flex items-center justify-center gap-6">
            <a
              href="https://gophers.uz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-white text-sm transition-colors">

              Portfolio
            </a>
            <a
              href="https://t.me/jons_dasturchi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-white text-sm transition-colors">

              Telegram
            </a>
            <Link
              to="/u/jons"
              className="text-gray-500 hover:text-white text-sm transition-colors">

              Creator's Profile
            </Link>
          </div>
        </div>
      </motion.footer>
    </main>);

}