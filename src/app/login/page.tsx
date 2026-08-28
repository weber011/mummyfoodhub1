"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsName, setNeedsName] = useState(false);
  const [devOtp, setDevOtp] = useState("");

  const router = useRouter();
  const { login } = useAuth();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    if (needsName && !name) {
      toast.error("Please enter your name to continue");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();

      if (data.needsName) {
        setNeedsName(true);
      } else if (data.success) {
        setStep("otp");
        if (data.devOtp) {
           setDevOtp(data.devOtp);
           toast.success(`(Dev Mode) OTP: ${data.devOtp}`, { duration: 8000 });
        } else {
           toast.success("OTP sent to your email!");
        }
      } else {
        toast.error(data.error || "Failed to send OTP");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, name }),
      });
      const data = await res.json();

      if (data.success) {
        login(data.user, data.isNewUser);
        router.push("/account");
      } else {
        toast.error(data.error || "Invalid OTP");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-20 px-4 bg-background">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-border overflow-hidden">
        <div className="p-8 sm:p-10">
          <div className="flex justify-center mb-8">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20 bg-white shadow-md">
              <Image src="/logo.png" alt="Mummy Food Hub" fill className="object-contain p-2" priority />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === "email" ? (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-heading font-bold text-foreground mb-2">Welcome</h1>
                  <p className="text-muted-foreground font-subheading text-sm">
                    Enter your email to sign in or create an account
                  </p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-subheading font-medium text-foreground ml-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3.5 rounded-xl border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-subheading"
                      disabled={loading || needsName}
                    />
                  </div>

                  <AnimatePresence>
                    {needsName && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-1.5 overflow-hidden"
                      >
                        <label className="text-sm font-subheading font-medium text-foreground ml-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="E.g. Rahul Sharma"
                          className="w-full px-4 py-3.5 rounded-xl border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-subheading"
                          disabled={loading}
                        />
                        <p className="text-xs text-primary font-subheading px-1 pt-1">
                          Since you&apos;re new here, we just need your name.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 font-subheading disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>Continue <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-heading font-bold text-foreground mb-2">Check your email</h1>
                  <p className="text-muted-foreground font-subheading text-sm">
                    We sent a 6-digit code to <span className="font-bold text-foreground">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="space-y-2 text-center">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="• • • • • •"
                      className="w-full text-center tracking-[1em] font-mono text-2xl px-4 py-4 rounded-xl border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      disabled={loading}
                    />
                  </div>
                  {devOtp && (
                     <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-center">
                        <p className="text-xs text-primary font-bold">DEV MODE ACTIVE: Email skipped.</p>
                        <p className="text-sm font-bold mt-1">Your code is: {devOtp}</p>
                     </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 font-subheading disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Sign In"}
                  </button>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => { setStep("email"); setOtp(""); setDevOtp(""); }}
                      className="text-xs font-subheading text-muted-foreground hover:text-primary transition-colors"
                    >
                      ← Change email
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleSendOtp}
                      className="text-xs font-bold text-primary hover:underline transition-colors disabled:opacity-50"
                    >
                      Resend Code
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
