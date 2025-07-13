import { localStorage } from "@/lib/localStorage";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Header() {
  const [, setLocation] = useLocation();
  const currentUser = localStorage.getCurrentUser();

  const handleLogout = () => {
    localStorage.clearCurrentUser();
    setLocation("/");
    window.location.reload();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-shield-alt text-primary text-2xl"></i>
              <h1 className="text-xl font-medium text-gray-900">SecuraCert</h1>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/")}
              className="text-gray-600 hover:text-primary"
            >
              Dashboard
            </Button>
          </nav>

          <div className="flex items-center space-x-4">
            {currentUser && (
              <div className="hidden md:flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {getInitials(currentUser.username)}
                  </span>
                </div>
                <span className="text-gray-700 text-sm">{currentUser.username}</span>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
