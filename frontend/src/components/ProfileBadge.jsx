import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { GraduationCap, Languages, Check, Settings2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAuth } from "../context/AuthContext";

const LANGS = [
  "English", "Malayalam", "Hindi", "Tamil", "Telugu", "Kannada",
  "Marathi", "Bengali", "Gujarati", "Punjabi", "Urdu",
];

/**
 * Compact academic-profile badge with a one-tap language switcher.
 * Changing language updates the profile so all future AI output adapts.
 */
export const ProfileBadge = ({ onChanged }) => {
  const { user, updateAcademicProfile } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const changeLanguage = async (lang) => {
    if (lang === user.language) return;
    try {
      await updateAcademicProfile({
        grade: user.grade,
        board: user.board,
        country: user.country,
        exam_target: user.exam_target,
        learning_level: user.learning_level,
        language: lang,
      });
      toast.success(`Switched to ${lang}`);
      onChanged && onChanged(lang);
    } catch {
      toast.error("Could not switch language");
    }
  };

  const label = [user.grade, user.board, user.language].filter(Boolean).join(" · ");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          data-testid="profile-badge"
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-gray-300 transition hover:bg-white/10 hover:text-white"
        >
          <GraduationCap size={14} className="text-blue-300" />
          <span className="max-w-[220px] truncate">{label || "Set up profile"}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 border-white/10 bg-[#0A0F1C] text-gray-200">
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-gray-400">
          <Languages size={13} /> Learning language
        </DropdownMenuLabel>
        <div className="max-h-56 overflow-y-auto">
          {LANGS.map((l) => (
            <DropdownMenuItem
              key={l}
              data-testid={`lang-${l}`}
              onClick={() => changeLanguage(l)}
              className="flex cursor-pointer items-center justify-between focus:bg-white/10"
            >
              {l}
              {user.language === l && <Check size={14} className="text-emerald-400" />}
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem
          data-testid="edit-profile"
          onClick={() => navigate("/app/profile")}
          className="flex cursor-pointer items-center gap-2 focus:bg-white/10"
        >
          <Settings2 size={14} /> Edit academic profile
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileBadge;
