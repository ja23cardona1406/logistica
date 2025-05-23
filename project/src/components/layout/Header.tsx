import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSession } from '../../context/SessionContext';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { activeSession, endSession } = useSession();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = React.useState(false);

  const handleLogout = async () => {
    if (activeSession) {
      await endSession();
    }
    await signOut();
  };

  return (
    <header className="bg-white border-b border-gray-200 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-600 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={24} />
            </button>
            <div className="ml-4 lg:ml-0">
              <h1 className="text-xl font-bold text-blue-900">Repremundo</h1>
            </div>
          </div>
          
          <div className="flex items-center">
            {activeSession && (
              <div className="hidden md:flex items-center mr-4 px-3 py-1 bg-green-100 text-green-800 rounded-full">
                <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                <span className="text-sm font-medium">Sesión activa</span>
              </div>
            )}
            
            <button className="p-2 text-gray-400 hover:text-gray-500 relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
            
            <div className="ml-3 relative">
              <div>
                <button
                  className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:shadow-outline"
                  id="user-menu"
                  aria-label="User menu"
                  aria-haspopup="true"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    <User size={16} />
                  </div>
                  <span className="ml-2 font-medium text-gray-700 hidden md:block">
                    {user?.first_name} {user?.last_name}
                  </span>
                </button>
              </div>
              
              {showMenu && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg"
                  onClick={() => setShowMenu(false)}
                >
                  <div className="py-1 rounded-md bg-white shadow-xs">
                    <button
                      className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => navigate('/profile')}
                    >
                      Perfil
                    </button>
                    <button
                      className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={handleLogout}
                    >
                      <div className="flex items-center">
                        <LogOut size={16} className="mr-2" />
                        <span>Cerrar sesión</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;