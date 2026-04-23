
import goldoIcon from '@common/assets/goldo_icon.png';
import GhidraManager from './GhidraManager';

const Header: React.FC = () => {
    return (
        <div>
            <div className='w-full h-24 bg-slate-200 border border-black border-opacity-20 shadow-md flex overflow-hidden pr-5 justify-between'>
                <p className='self-center ml-5 font-mono font-bold text-2xl'>
                    ProvScope App
                </p>
                <img 
                    src={goldoIcon} 
                    alt="Logo"
                    className='flex-shrink-0'
                />
            </div>
            <div className="flex gap-3 absolute right-[150px] top-[30px] items-center">
                <button 
                    className="border border-gray-700 bg-white rounded hover:bg-blue-200 px-3 py-1"
                    onClick={() => window.api.sendClick("use_ghidra")}
                >  
                    Ghidra
                </button>

                <GhidraManager />
            </div>
        </div>
    );
}

export default Header;
