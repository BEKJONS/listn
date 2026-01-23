import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import {
  HomeIcon,
  EditIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LinkIcon
} from
  'lucide-react';
import { Button } from '../components/Button';

export function PublicProfilePage() {
  const { username } = useParams<{
    username: string;
  }>();
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [profile, setProfile] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!username) {
      setIsLoading(false);
      return;
    }

    // 1. Fetch Profile Data
    fetch(`/api/profile/${username}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        if (!data || !data.user) {
          throw new Error('Invalid data');
        }

        setProfile({
          displayName: data.user.displayName || data.user.username,
          role: data.user.roleTitle || 'Music Lover',
          links: Array.isArray(data.links) ? data.links : [],
          tracks: Array.isArray(data.tracks) ? data.tracks.map((t: any) => t.iframeSrc) : [],
          quote: data.user.views > 10 ? '"One track. Deep focus."' : '"Music is life."'
        });

        // 2. Check if owner (session check)
        fetch('/api/me')
          .then(res => res.json())
          .then(meData => {
            if (meData.user && meData.user.id === data.user.id) {
              setIsOwner(true);
            }
          })
          .catch(() => {
            // Ignore errors for owner check
          })
          .finally(() => setIsLoading(false));
      })
      .catch((err) => {
        console.error('Error fetching profile:', err);
        setIsLoading(false);
        setProfile(null);
      });
  }, [username]);

  const nextTrack = () => {
    if (!profile) return;
    setCurrentTrackIndex((prev) =>
      prev < profile.tracks.length - 1 ? prev + 1 : 0
    );
  };
  const prevTrack = () => {
    if (!profile) return;
    setCurrentTrackIndex((prev) =>
      prev > 0 ? prev - 1 : profile.tracks.length - 1
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-4">Profile not found</p>
          <Link to="/" className="text-gray-500 hover:text-white transition-colors underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }
  return (
    <main className="min-h-screen w-full bg-black relative">
      {/* Navigation */}
      <motion.nav
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}
        transition={{
          delay: 0.2
        }}
        className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-4 flex items-center justify-between">

        <Link to="/">
          <Button variant="secondary" className="flex items-center gap-2">
            <HomeIcon className="w-4 h-4" />
            Home
          </Button>
        </Link>

        {isOwner &&
          <Link to="/dashboard">
            <Button variant="secondary" className="flex items-center gap-2">
              <EditIcon className="w-4 h-4" />
              Edit Profile
            </Button>
          </Link>
        }
      </motion.nav>

      {/* Profile Content */}
      <div className="pt-24 md:pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Name */}
          <motion.h1
            initial={{
              opacity: 0,
              y: 30
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              duration: 0.6,
              delay: 0.1
            }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-4">

            {profile.displayName}
          </motion.h1>

          {/* Role Badge */}
          <motion.div
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
            className="inline-block">

            <span
              className="
              inline-block px-6 py-2 rounded-full
              border border-white/10 text-gray-400
              text-sm tracking-wider
            ">





              {profile.role}
            </span>
          </motion.div>

          {/* Music Section */}
          <motion.section
            initial={{
              opacity: 0,
              y: 30
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              duration: 0.6,
              delay: 0.3
            }}
            className="mt-16">

            <h2 className="text-xs tracking-[0.3em] text-gray-500 mb-8">
              WHAT I'M LISTENING TO RIGHT NOW
            </h2>

            {/* Music Carousel */}
            <div className="relative max-w-xl mx-auto">
              {/* Navigation Arrows */}
              {profile.tracks.length > 1 &&
                <>
                  <button
                    onClick={prevTrack}
                    className="
                      absolute left-0 md:-left-12 top-1/2 -translate-y-1/2 z-10
                      w-10 h-10 rounded-full bg-white/5 hover:bg-white/10
                      flex items-center justify-center
                      transition-colors duration-200
                    "





                    aria-label="Previous track">

                    <ChevronLeftIcon className="w-5 h-5 text-gray-400" />
                  </button>
                  <button
                    onClick={nextTrack}
                    className="
                      absolute right-0 md:-right-12 top-1/2 -translate-y-1/2 z-10
                      w-10 h-10 rounded-full bg-white/5 hover:bg-white/10
                      flex items-center justify-center
                      transition-colors duration-200
                    "





                    aria-label="Next track">

                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                  </button>
                </>
              }

              {/* Track Embed */}
              <div className="overflow-hidden rounded-xl">
                {profile.tracks && profile.tracks.length > 0 ? (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentTrackIndex}
                      initial={{
                        opacity: 0,
                        x: 50
                      }}
                      animate={{
                        opacity: 1,
                        x: 0
                      }}
                      exit={{
                        opacity: 0,
                        x: -50
                      }}
                      transition={{
                        duration: 0.3
                      }}>

                      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                        <iframe
                          src={profile.tracks[currentTrackIndex]}
                          width="100%"
                          height="180"
                          frameBorder="0"
                          allow="autoplay; encrypted-media"
                          className="block"
                          title="Yandex Music Track" />

                      </div>
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-8 text-center">
                    <p className="text-gray-500">No tracks added yet.</p>
                  </div>
                )}
              </div>

              {/* Pagination Dots */}
              {profile.tracks.length > 1 &&
                <div className="flex items-center justify-center gap-2 mt-6">
                  {profile.tracks.map((_: any, index: number) =>
                    <button
                      key={index}
                      onClick={() => setCurrentTrackIndex(index)}
                      className={`
                        w-2 h-2 rounded-full transition-all duration-200
                        ${index === currentTrackIndex ? 'bg-white w-4' : 'bg-white/30 hover:bg-white/50'}
                      `}
                      aria-label={`Go to track ${index + 1}`} />

                  )}
                </div>
              }
            </div>

            {/* Quote */}
            <motion.p
              initial={{
                opacity: 0
              }}
              animate={{
                opacity: 1
              }}
              transition={{
                delay: 0.5
              }}
              className="mt-10 text-gray-500 italic text-lg">

              {profile.quote}
            </motion.p>
          </motion.section>

          {/* Social Links */}
          {profile.links && profile.links.length > 0 && (
            <motion.footer
              initial={{
                opacity: 0
              }}
              animate={{
                opacity: 1
              }}
              transition={{
                delay: 0.6
              }}
              className="mt-16 flex items-center justify-center gap-8 flex-wrap">

              {profile.links.map((link: any) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-white transition-colors flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  {link.name}
                </a>
              ))}
            </motion.footer>
          )}
        </div>
      </div>
    </main>);

}