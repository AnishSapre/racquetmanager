"use client";

import Navbar from "@/app/components/NavBar";
import { usePathname } from "next/navigation";
import AutoRedirect from "./AutoRedirect";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <AutoRedirect>
            {pathname !== "/" && <Navbar />}
            {children}
        </AutoRedirect>
    );
}
