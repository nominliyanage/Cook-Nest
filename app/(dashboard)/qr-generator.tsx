import { useEffect } from "react";
import { useRouter } from "expo-router";

// This QR Generator has been replaced with Fresh Discovery
export default function QRGeneratorRedirect() {
    const router = useRouter();

    useEffect(() => {
        // Automatically redirect to Fresh Discovery
        router.replace("/(dashboard)/fresh-discovery");
    }, [router]);

    return null;
}
