import { Link, Outlet, useLocation } from 'react-router-dom';
import logoImage from '../../assets/90c5d6bf4c03d5cb5ffab3af18389097f479007b.png';
import authVisual from '../../assets/auth-visual-final.jpg';

export function AuthLayout() {
    const location = useLocation();
    const isLogin = location.pathname === '/login';

    return (
        // Main Container: Transparent background to show global grid
        <div className="h-screen w-full grid grid-cols-1 md:grid-cols-2 overflow-hidden bg-transparent">
            {/* Force hide scrollbar styles */}
            <style>{`
            .no-scrollbar::-webkit-scrollbar {
                display: none;
            }
            .no-scrollbar {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
        `}</style>

            {/* Left Side - Form Area */}
            {/* no-scrollbar class applied to hide visual scrollbar */}
            <div className="flex flex-col relative z-20 bg-transparent h-full overflow-y-auto no-scrollbar">
                {/* Main Content Container */}
                <div className="flex-1 flex flex-col justify-center items-center px-8 sm:px-12 lg:px-16 xl:px-24 w-full max-w-lg mx-auto py-12">

                    {/* Logo - Centered */}
                    <Link to="/" className="flex flex-col items-center gap-2 mb-2 hover:opacity-80 transition-opacity">
                        <img
                            src={logoImage}
                            alt="DataIQ Logo"
                            className="h-14 w-auto object-contain"
                        />
                        <span className="text-2xl font-bold tracking-tight text-primary">DataIQ</span>
                    </Link>

                    {/* Headings - Centered */}
                    <div className="flex flex-col items-center space-y-2 mb-6 text-center w-full">
                        <h1 className="text-3xl md:text-4xl font-bold text-[#0F172A] tracking-tight">
                            {isLogin ? 'Welcome back' : 'Create an account'}
                        </h1>
                        <p className="text-muted-foreground text-base">
                            {isLogin
                                ? <>New to DataIQ? <Link to="/signup" className="text-primary hover:underline font-medium ml-1">Create an account</Link></>
                                : <>Already have an account? <Link to="/login" className="text-primary hover:underline font-medium ml-1">Log in</Link></>
                            }
                        </p>
                    </div>

                    {/* Form Content */}
                    <div className="w-full">
                        <Outlet />
                    </div>

                    {/* Footer - Centered */}
                    <div className="mt-8 text-sm text-muted-foreground text-center">
                        &copy; {new Date().getFullYear()} DataIQ. All rights reserved.
                    </div>
                </div>
            </div>

            {/* Right Side - Visual Area */}
            <div className="hidden md:flex relative h-full bg-transparent p-4 lg:p-6 items-center justify-center">
                {/* Container for the Image with Rounded Corners and Floating Effect */}
                <div className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-2xl">
                    {/* Full Background Image - Clean, no text */}
                    <img
                        src={authVisual}
                        alt="DataIQ Visual"
                        className="absolute inset-0 w-full h-full object-cover object-center z-0"
                        style={{ objectPosition: "center" }}
                    />

                    {/* No gradient or text overlay, letting the image shine as requested */}
                </div>
            </div>
        </div>
    );
}
