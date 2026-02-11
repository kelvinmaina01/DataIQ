import { useState, useEffect, useRef } from 'react';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged, updateProfile, type User } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import {
    Mail,
    Globe,
    MapPin,
    Camera,
    Settings,
    ShieldCheck,
    ChevronDown,
    Briefcase,
    Building2,
    StickyNote,
    Heart,
    AlertTriangle,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../components/ui/utils';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';

export function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [profileData, setProfileData] = useState({
        displayName: "",
        jobTitle: "",
        organization: "",
        bio: "",
        location: "",
        website: "",
        healthFocus: "Data Analytics & BI"
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                await fetchProfileData(currentUser.uid);
            } else {
                setIsLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchProfileData = async (uid: string) => {
        try {
            const docRef = doc(db, "users", uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setProfileData({
                    displayName: data.displayName || "",
                    jobTitle: data.jobTitle || "",
                    organization: data.organization || "",
                    bio: data.bio || "",
                    location: data.location || "",
                    website: data.website || "",
                    healthFocus: data.healthFocus || "Health Programs & NGOs"
                });
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            toast.error("Failed to load profile data.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveChanges = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const docRef = doc(db, "users", user.uid);
            await setDoc(docRef, {
                ...profileData,
                updatedAt: serverTimestamp()
            }, { merge: true });
            toast.success("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to save changes. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        // Check file type
        if (!file.type.startsWith('image/')) {
            toast.error("Please upload an image file");
            return;
        }

        // Check file size (limit to 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Image size should be less than 2MB");
            return;
        }

        setIsUploading(true);
        try {
            const avatarRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${file.name}`);
            const uploadResult = await uploadBytes(avatarRef, file);
            const downloadURL = await getDownloadURL(uploadResult.ref);

            // Update Auth Profile
            await updateProfile(user, { photoURL: downloadURL });

            // Update Firestore Document
            const docRef = doc(db, "users", user.uid);
            await setDoc(docRef, {
                photoURL: downloadURL,
                updatedAt: serverTimestamp()
            }, { merge: true });

            toast.success("Avatar updated successfully!");
        } catch (error) {
            console.error("Error uploading avatar:", error);
            toast.error("Failed to upload avatar.");
        } finally {
            setIsUploading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-[60vh] w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
        );
    }

    const displayName = profileData.displayName || user?.displayName || user?.email?.split('@')[0] || "User";
    const userEmail = user?.email || "";
    const userPhoto = user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0E50F6&color=fff`;

    return (
        <div className="max-w-6xl mx-auto animate-slide-up pb-12">
            {/* Header / Banner Area */}
            <div className="relative mb-20">
                <div className="h-48 w-full rounded-[2rem] bg-gradient-to-r from-[#0E50F6]/10 via-[#F3F0FF] to-[#D9F7FF] border border-[#0E50F6]/20 shadow-sm overflow-hidden text-primary">
                    <div className="absolute inset-0 bg-[#0E50F6]/5 backdrop-blur-[1px]"></div>
                </div>

                <div className="absolute -bottom-16 left-10 flex items-end gap-6">
                    <div className="relative group">
                        <Avatar className="h-32 w-32 ring-4 ring-white shadow-2xl relative">
                            <AvatarImage src={userPhoto} />
                            <AvatarFallback className="text-3xl font-semibold bg-primary text-white">
                                {displayName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                            {isUploading && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                </div>
                            )}
                        </Avatar>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                        <button
                            onClick={handleAvatarClick}
                            disabled={isUploading}
                            className="absolute bottom-1 right-1 p-2 bg-[#0E50F6] text-white rounded-full border-4 border-white shadow-lg hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="pb-4">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">{displayName}</h1>
                        <div className="flex items-center gap-4 text-slate-400 font-semibold text-sm">
                            <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {profileData.jobTitle || "No Title"}</span>
                            <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {profileData.organization || "No Organization"}</span>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-4 right-10">
                    <Button variant="outline" className="rounded-xl font-semibold gap-2 border-border/50 bg-white/80 backdrop-blur-sm">
                        <Settings className="w-4 h-4" />
                        Settings
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Intelligence Profile Card */}
                    <div className="bg-white border border-[#0E50F6]/20 shadow-sm rounded-[2rem] p-8">
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Intelligence Profile</h3>
                        <p className="text-sm text-[#0E50F6] font-semibold mb-6">Select your data intelligence focus</p>

                        <div className="relative">
                            <select
                                value={profileData.healthFocus}
                                onChange={(e) => setProfileData({ ...profileData, healthFocus: e.target.value })}
                                className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="Data Analytics & BI">Data Analytics & BI</option>
                                <option value="AI & Machine Learning">AI & Machine Learning</option>
                                <option value="Predictive Modeling">Predictive Modeling</option>
                                <option value="Data Engineering">Data Engineering</option>
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                            </div>
                            <p className="mt-4 text-[11px] text-[#0E50F6] font-semibold leading-relaxed tracking-tight">
                                This customizes your experience and available tools.
                            </p>
                        </div>
                    </div>

                    {/* Contact Info Card */}
                    <div className="bg-white border border-[#0E50F6]/20 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Contact Info</h3>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
                                <Mail className="w-4 h-4 text-slate-400" />
                                <span>{userEmail}</span>
                            </div>

                            <div className="relative flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 group-focus-within:bg-white transition-all">
                                <Globe className="w-4 h-4 text-slate-400 mr-3" />
                                <input
                                    type="text"
                                    placeholder="Website URL"
                                    value={profileData.website}
                                    onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                                    className="bg-transparent border-none outline-none text-sm font-semibold w-full placeholder:text-slate-300"
                                />
                            </div>

                            <div className="relative flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 group-focus-within:bg-white transition-all">
                                <MapPin className="w-4 h-4 text-slate-400 mr-3" />
                                <input
                                    type="text"
                                    placeholder="Location"
                                    value={profileData.location}
                                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                                    className="bg-transparent border-none outline-none text-sm font-semibold w-full placeholder:text-slate-300"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone Section */}
                    <div className="bg-rose-50/50 border border-[#0E50F6]/20 rounded-[2rem] p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-rose-100 rounded-xl">
                                <AlertTriangle className="w-5 h-5 text-rose-500" />
                            </div>
                            <h3 className="text-lg font-bold text-rose-900">Danger Zone</h3>
                        </div>
                        <p className="text-sm text-rose-600 font-semibold mb-6">
                            Once you delete your account, there is no going back. Please be certain.
                        </p>
                        <Button
                            variant="destructive"
                            className="w-full bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-xl font-bold h-12 shadow-lg shadow-rose-500/20 uppercase text-xs tracking-wider border-none"
                        >
                            Delete Account
                        </Button>
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-8">
                    <div className="bg-white border border-border/50 rounded-[2rem] shadow-sm flex flex-col h-full overflow-hidden">
                        <div className="p-8 flex-1">
                            <h3 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">Personal Information</h3>
                            <p className="text-sm text-[#0E50F6] font-semibold mb-8">Update your personal details and bio.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={profileData.displayName}
                                        onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Job Title</label>
                                    <input
                                        type="text"
                                        placeholder="Add your title"
                                        value={profileData.jobTitle}
                                        onChange={(e) => setProfileData({ ...profileData, jobTitle: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 mb-6">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Organization / Institution</label>
                                <input
                                    type="text"
                                    placeholder="Where do you work?"
                                    value={profileData.organization}
                                    onChange={(e) => setProfileData({ ...profileData, organization: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Bio</label>
                                <textarea
                                    placeholder="Tell us about your data goals..."
                                    rows={6}
                                    value={profileData.bio}
                                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                                />
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                                <ShieldCheck className="w-4 h-4" />
                                Your data is secure
                            </div>
                            <Button
                                onClick={handleSaveChanges}
                                disabled={isSaving}
                                className="bg-[#0E50F6] hover:bg-[#0D44D1] text-white px-8 h-12 rounded-xl font-semibold shadow-lg shadow-[#0E50F6]/20 gap-2 uppercase text-xs tracking-wider disabled:opacity-70"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <StickyNote className="w-4 h-4" />}
                                {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
