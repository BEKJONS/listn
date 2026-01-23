import { motion } from 'framer-motion';
import { EyeIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
type ProfileCardProps = {
  name: string;
  role: string;
  visitCount: number;
  username: string;
  index?: number;
};
export function ProfileCard({
  name,
  role,
  visitCount,
  username,
  index = 0
}: ProfileCardProps) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (username && username.trim()) {
      navigate(`/u/${username.trim()}`);
    }
  };

  return (
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
        duration: 0.4,
        delay: index * 0.1
      }}
      onClick={handleClick}
      className="
        bg-white/[0.02] border border-white/[0.06] rounded-xl p-5
        cursor-pointer group
        hover:bg-white/[0.04] hover:border-white/10
        transition-all duration-300
      ">






      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-white font-semibold text-lg group-hover:text-white/90 transition-colors">
            {name}
          </h3>
          <p className="text-gray-500 text-sm uppercase tracking-wide">
            {role}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-gray-500">
          <EyeIcon className="w-4 h-4" />
          <span className="text-sm">{visitCount}</span>
        </div>
      </div>
    </motion.div>);

}