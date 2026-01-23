import * as React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  // Toggle between login and register based on some state or UI
  // For now, let's just make it handle the existing form.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const body = new URLSearchParams();
    body.append('username', formData.username);
    body.append('password', formData.password);

    const endpoint = isRegister ? '/register' : '/login';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: body,
      });

      if (response.ok) {
        // Redirection logic
        if (isRegister) {
          alert('Registration successful! Please login.');
          setIsRegister(false);
        } else {
          navigate('/dashboard');
        }
      } else {
        const text = await response.text();
        alert('Error: ' + text);
      }
    } catch (err) {
      alert('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <main className="min-h-screen w-full bg-black flex items-center justify-center px-4">
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
          duration: 0.5
        }}
        className="w-full max-w-md">

        <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-8 md:p-10">
          <motion.h1
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            transition={{
              delay: 0.2
            }}
            className="text-2xl md:text-3xl font-bold text-white text-center mb-8">

            {isRegister ? 'Create Account' : 'Login'}
          </motion.h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div
              initial={{
                opacity: 0,
                x: -10
              }}
              animate={{
                opacity: 1,
                x: 0
              }}
              transition={{
                delay: 0.3
              }}>

              <Input
                type="text"
                placeholder="Username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    username: e.target.value
                  })
                } />

            </motion.div>

            <motion.div
              initial={{
                opacity: 0,
                x: -10
              }}
              animate={{
                opacity: 1,
                x: 0
              }}
              transition={{
                delay: 0.4
              }}>

              <Input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    password: e.target.value
                  })
                } />

            </motion.div>

            <motion.div
              initial={{
                opacity: 0
              }}
              animate={{
                opacity: 1
              }}
              transition={{
                delay: 0.5
              }}>

              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || !formData.username || !formData.password}
                className="w-full">

                {isLoading ? (isRegister ? 'Creating...' : 'Logging in...') : (isRegister ? 'Sign Up' : 'Login')}
              </Button>
            </motion.div>
          </form>

          <motion.p
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            transition={{
              delay: 0.6
            }}
            className="text-center mt-6 text-gray-500 text-sm">

            {isRegister ? 'Already have an account?' : 'New here?'}{' '}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-gray-400 hover:text-white transition-colors underline underline-offset-2">

              {isRegister ? 'Login' : 'Register'}
            </button>
          </motion.p>
        </div>
      </motion.div>
    </main>);

}