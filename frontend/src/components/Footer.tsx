import { Mail } from 'lucide-react';
import { BsTiktok } from "react-icons/bs";
import { BsInstagram } from "react-icons/bs";
import { BsFacebook } from "react-icons/bs";
import { BsEnvelopeFill } from "react-icons/bs";
import { BsFillPinAngleFill } from "react-icons/bs";
import { Button } from './ui/Button';
import { useNavigate } from 'react-router-dom';


const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="text-center p-10 bg-[var(--secondary-red)] text-white mt-20 w-full z-20">
      <div className="flex justify-center mb-4 gap-10 flex-wrap min-h-72 text-xl">
        {/* Sign up for membership */}
        <div className="text-left flex-1">
          <h2 className="text-wrap max-w-80 font-bold text-4xl mb-2 text-[var(--secondary-text)]">Love the chuckle?</h2>
          <p>Sign up now and enjoy numerous benefits!</p>
          <Button size="lg" className="mt-4 py-2" onClick={() => navigate("/membership")}>Join us</Button>
        </div>

        {/* Contact */}
        <div className="text-left flex-1 flex flex-col gap-4">
          <div>
            <h2 className="font-bold text-4xl mb-2 text-[var(--secondary-text)]">Contact Us</h2>
            <p>Do you have any questions?</p>
            <p>Send us a message to</p>
          </div>

          <div>
            <a className="flex gap-1" href="mailto:unsw.ppia@gmail.com" >  
              <BsEnvelopeFill size={20} className="mt-1"/>
              <p className="flex gap-1 items-center ml-1">unsw.ppia@gmail.com</p>
            </a>
            <div className="flex gap-1">
              <BsFillPinAngleFill size={20} className="mt-1"/>
              <p>UNSW, Sydney NSW 2033, Australia</p>
            </div>
          </div>

          {/* Social links */}
          <div className="flex gap-3 mt-4">
            <BsFacebook size={20} className="hover:cursor-pointer hover:text-[var(--primary-red)] ease-in-out duration-300" onClick={() => window.open("https://www.facebook.com/page.ppia.unsw", "_blank")}/>
            <BsInstagram size={20} className="hover:cursor-pointer hover:text-[var(--primary-red)] ease-in-out duration-300" onClick={() => window.open("https://www.instagram.com/ppiaunsw", "_blank")}/>
            <BsTiktok size={20} className="hover:cursor-pointer hover:text-[var(--primary-red)] ease-in-out duration-300" onClick={() => window.open("https://www.tiktok.com/@ppiaunsw", "_blank")}/>
          </div>
        </div>
      </div>

      {/* Bottom section with copyright and acknowledgment link */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mt-6 pt-4 border-t border-white/20">
        <div>© 2025 Ignite. All rights reserved.</div>
        <div
          className="flex items-center gap-1 text-sm cursor-pointer hover:text-[var(--secondary-text)] transition-colors duration-300"
          onClick={() => navigate("/acknowledgment")}
        >
          <span>Made with</span>
          <span className="text-red-400">❤️</span>
          <span>by PPIA IT Team</span>
        </div>
      </div>
    </footer>
  );
};

export { Footer };
