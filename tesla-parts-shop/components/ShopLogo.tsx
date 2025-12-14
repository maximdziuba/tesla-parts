
// import { FaTelegramPlane, FaViber, FaWhatsapp } from 'react-icons/fa';
import teslaLogo from '../static/tesla-logo.png';
 // Assuming image_0.png is in the same directory

const TeslaPartsCenterLogo = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  return (
    <div 
            onClick={() => onNavigate('home')} 
            className="cursor-pointer flex items-center gap-3"
          >
            <img 
              src={teslaLogo} 
              alt="Tesla Logo" 
              className="h-10 md:h-12 w-auto object-contain"
            />
            <div className="flex flex-col items-start font-tesla">
              <span className="text-tesla-red font-bold text-xl md:text-2xl leading-tight">TESLA</span>
              <span className="text-black font-bold text-xl md:text-2xl leading-tight">PARTS</span>
              <span className="text-black font-bold text-xl md:text-2xl leading-tight">CENTER</span>
            </div>
          </div>
  );
};

export default TeslaPartsCenterLogo;