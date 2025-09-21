import { db } from "../firebase";
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    getDoc,
    setDoc,
} from "firebase/firestore";

export interface UserProfile {
    uid: string;
    email: string;
    displayName?: string;
    profileImage?: string;
    phone?: string;
    bio?: string;
    createdAt: string;
}

export const userColRef = collection(db, "users");

export const uploadImageToCloudinary = async (imageUri: string) => {
    const data = new FormData();
    data.append("file", {
        uri: imageUri,
        type: "image/jpeg",
        name: "profile.jpg",
    } as any);
    data.append("upload_preset", "my_preset"); // Replace with your preset

    const res = await fetch(
        "https://api.cloudinary.com/v1_1/dfwzzxgja/image/upload",
        {
            method: "POST",
            body: data,
        }
    );
    const result = await res.json();
    if (!result.secure_url) {
        console.error("Cloudinary upload failed:", result);
        return "";
    }
    return result.secure_url;
};

export const createUserProfile = async (userProfile: UserProfile) => {
    let profileImageUrl = userProfile.profileImage;
    if (profileImageUrl && profileImageUrl.startsWith("file://")) {
        profileImageUrl = await uploadImageToCloudinary(profileImageUrl);
    }

    const userDocRef = doc(db, "users", userProfile.uid);
    await setDoc(userDocRef, { ...userProfile, profileImage: profileImageUrl });
    return userProfile.uid;
};

export const getUserProfile = async (
    uid: string
): Promise<UserProfile | null> => {
    const userDocRef = doc(db, "users", uid);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
        return userSnap.data() as UserProfile;
    }
    return null;
};

export const updateUserProfile = async (
    uid: string,
    updates: Partial<UserProfile>
) => {
    let profileImageUrl = updates.profileImage;
    if (profileImageUrl && profileImageUrl.startsWith("file://")) {
        profileImageUrl = await uploadImageToCloudinary(profileImageUrl);
        updates.profileImage = profileImageUrl;
    }

    const userDocRef = doc(db, "users", uid);

    // Check if document exists first
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
        // Document exists, update it
        await updateDoc(userDocRef, updates);
    } else {
        // Document doesn't exist, create it with basic info + updates
        const newProfile: UserProfile = {
            uid,
            email: updates.email || "", // Will be set from auth context
            displayName: updates.displayName || "",
            profileImage: profileImageUrl || "",
            phone: updates.phone || "",
            bio: updates.bio || "",
            createdAt: new Date().toISOString(),
            ...updates,
        };
        await setDoc(userDocRef, newProfile);
    }
};

export const createOrUpdateUserProfile = async (
    uid: string,
    email: string,
    updates: Partial<UserProfile>
) => {
    let profileImageUrl = updates.profileImage;
    if (profileImageUrl && profileImageUrl.startsWith("file://")) {
        profileImageUrl = await uploadImageToCloudinary(profileImageUrl);
        updates.profileImage = profileImageUrl;
    }

    const userDocRef = doc(db, "users", uid);

    // Always use setDoc with merge to create or update
    const profileData: UserProfile = {
        uid,
        email,
        displayName: updates.displayName || "",
        profileImage: profileImageUrl || "",
        phone: updates.phone || "",
        bio: updates.bio || "",
        createdAt: new Date().toISOString(),
        ...updates,
    };

    await setDoc(userDocRef, profileData, { merge: true });
};
