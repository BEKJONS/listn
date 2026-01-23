import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { PlusIcon, XIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { MusicTrackEmbed } from '../components/MusicTrackEmbed';

type Track = {
  id: string;
  embedUrl: string;
};

type UserLink = {
  id: number;
  name: string;
  url: string;
};

export function DashboardPage() {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    username: '',
    displayName: '',
    role: '',
    customUrl: ''
  });
  const [newTrackUrl, setNewTrackUrl] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [links, setLinks] = useState<UserLink[]>([]);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setProfileData({
            username: data.user.username || '',
            displayName: data.user.displayName || '',
            role: data.user.roleTitle || '',
            customUrl: data.user.customUrl || ''
          });
        }
        if (Array.isArray(data.tracks)) {
          setTracks(data.tracks.map((t: any) => ({
            id: t.id.toString(),
            embedUrl: t.iframeSrc
          })));
        }
        if (Array.isArray(data.links)) {
          setLinks(data.links);
        }
        setIsLoading(false);
      })
      .catch(() => {
        navigate('/login');
      });
  }, [navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = new URLSearchParams();
    body.append('display_name', profileData.displayName);
    body.append('role_title', profileData.role);
    body.append('custom_url', profileData.customUrl);

    const res = await fetch('/api/update_profile', {
      method: 'POST',
      body: body,
    });
    if (res.ok) {
      alert('Profile updated!');
    } else {
      const text = await res.text();
      alert('Error: ' + text);
    }
  };

  const handleAddLink = async () => {
    if (newLinkName.trim() && newLinkUrl.trim()) {
      const body = new URLSearchParams();
      body.append('name', newLinkName);
      body.append('url', newLinkUrl);

      const res = await fetch('/api/add_link', {
        method: 'POST',
        body: body,
      });

      if (res.ok) {
        // Re-fetch to get updated links
        const dataRes = await fetch('/api/me');
        const data = await dataRes.json();
        if (Array.isArray(data.links)) {
          setLinks(data.links);
        }
        setNewLinkName('');
        setNewLinkUrl('');
      } else {
        const text = await res.text();
        alert('Failed to add link: ' + text);
      }
    }
  };

  const handleRemoveLink = async (linkId: number) => {
    const body = new URLSearchParams();
    body.append('id', linkId.toString());

    const res = await fetch('/api/remove_link', {
      method: 'POST',
      body: body,
    });

    if (res.ok) {
      // Re-fetch to get updated links
      const dataRes = await fetch('/api/me');
      const data = await dataRes.json();
      if (Array.isArray(data.links)) {
        setLinks(data.links);
      }
    } else {
      alert('Failed to remove link');
    }
  };

  const handleAddTrack = async () => {
    if (newTrackUrl.trim()) {
      const body = new URLSearchParams();
      body.append('track_input', newTrackUrl);

      const res = await fetch('/api/add_track', {
        method: 'POST',
        body: body,
      });

      if (res.ok) {
        // Re-fetch to get the list with the new track (and its real ID/parsed URL)
        const dataRes = await fetch('/api/me');
        const data = await dataRes.json();
        if (Array.isArray(data.tracks)) {
          setTracks(data.tracks.map((t: any) => ({
            id: t.id.toString(),
            embedUrl: t.iframeSrc
          })));
        }
        setNewTrackUrl('');
      } else {
        alert('Failed to add track');
      }
    }
  };

  const handleRemoveTrack = (id: string) => {
    // Backend doesn't support removal yet, just UI feedback for now or skip
    setTracks(tracks.filter((t) => t.id !== id));
  };

  const handleLogout = async () => {
    await fetch('/logout');
    navigate('/login');
  };

  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
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
        className="border-b border-white/[0.06] px-4 md:px-8 py-4">

        <nav className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center gap-4 md:gap-0">
          <h1 className="text-xl md:text-2xl font-bold text-white">
            Listn Dashboard
          </h1>
          <div className="flex items-center gap-4 md:ml-auto text-sm">
            <Link
              to="/"
              className="text-gray-400 hover:text-white transition-colors">

              Home
            </Link>
            <Link
              to={`/u/${profileData.customUrl || profileData.username || 'ozodjon'}`}
              className="text-gray-400 hover:text-white transition-colors underline underline-offset-2">

              View Public Profile
            </Link>
            <span className="text-gray-600">|</span>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-white transition-colors">

              Logout
            </button>
          </div>
        </nav>
      </motion.header>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Profile Info Section */}
        <motion.section
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: 0.1
          }}
          className="mb-12">

          <h2 className="text-xl font-bold text-white mb-6">
            Your Profile Info
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-xl">
            <Input
              label="Display Name (Large Title)"
              value={profileData.displayName}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  displayName: e.target.value
                })
              } />


            <Input
              label="Role / Title (Subtitle)"
              value={profileData.role}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  role: e.target.value
                })
              } />


            <Input
              label="Custom URL (Your public page will be /u/your-custom-url)"
              value={profileData.customUrl}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  customUrl: e.target.value
                })
              }
              helperText="Leave empty to use your username. Only letters, numbers, hyphens, and underscores allowed." />


            <Button type="submit" variant="primary">
              Update Profile
            </Button>
          </form>
        </motion.section>

        {/* Add Music Section */}
        <motion.section
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: 0.2
          }}>

          <h2 className="text-xl font-bold text-white mb-2">Add Music</h2>
          <p className="text-gray-500 text-sm mb-4">
            Paste a Yandex Music Track URL or the full iframe code.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-xl mb-8">
            <Input
              placeholder="https://music.yandex.ru/album/..."
              value={newTrackUrl}
              onChange={(e) => setNewTrackUrl(e.target.value)}
              className="flex-1" />

            <Button
              variant="primary"
              onClick={handleAddTrack}
              disabled={!newTrackUrl.trim()}
              className="flex items-center justify-center gap-2">

              <PlusIcon className="w-4 h-4" />
              Add Track
            </Button>
          </div>

          <h3 className="text-lg font-semibold text-white mb-4">Your Tracks</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <AnimatePresence>
              {tracks.map((track) =>
                <MusicTrackEmbed
                  key={track.id}
                  embedUrl={track.embedUrl}
                  showRemove
                  onRemove={() => handleRemoveTrack(track.id)} />

              )}
            </AnimatePresence>
          </div>

          {tracks.length === 0 &&
            <p className="text-gray-600 text-sm">
              No tracks added yet. Add your first track above!
            </p>
          }
        </motion.section>

        {/* Links Section */}
        <motion.section
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: 0.3
          }}
          className="mt-12">

          <h2 className="text-xl font-bold text-white mb-2">Your Links</h2>
          <p className="text-gray-500 text-sm mb-4">
            Add custom links to your profile (e.g., GitHub, Portfolio, Blog, etc.)
          </p>

          {/* Add Link Form */}
          <div className="space-y-3 max-w-xl mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Link Name (e.g., GitHub)"
                value={newLinkName}
                onChange={(e) => setNewLinkName(e.target.value)}
                className="flex-1" />
              <Input
                placeholder="URL (e.g., https://github.com/username)"
                type="url"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                className="flex-1" />
              <Button
                variant="primary"
                onClick={handleAddLink}
                disabled={!newLinkName.trim() || !newLinkUrl.trim()}
                className="flex items-center justify-center gap-2">
                <PlusIcon className="w-4 h-4" />
                Add Link
              </Button>
            </div>
          </div>

          {/* Links List */}
          <div className="space-y-2 max-w-xl">
            {links.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
                <div className="flex-1">
                  <p className="text-white font-medium">{link.name}</p>
                  <p className="text-gray-500 text-sm truncate">{link.url}</p>
                </div>
                <button
                  onClick={() => handleRemoveLink(link.id)}
                  className="ml-4 p-2 text-gray-500 hover:text-red-400 transition-colors">
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
            {links.length === 0 && (
              <p className="text-gray-600 text-sm">
                No links added yet. Add your first link above!
              </p>
            )}
          </div>
        </motion.section>
      </div>
    </main>);

}