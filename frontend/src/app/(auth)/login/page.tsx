"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { Mail, Lock, ArrowRight, BarChart3, Loader2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Parallax mouse tracking
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMouse({ x, y });
    });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [handleMouseMove]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      router.push("/");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4 relative overflow-hidden">

      {/* === PARALLAX GLOW LAYERS === */}

      {/* Glow 1 - Large, top-left, slow */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          top: "-10%",
          left: "-5%",
          background: "radial-gradient(circle, rgba(0,122,255,0.15) 0%, transparent 70%)",
          transform: `translate(${mouse.x * 30}px, ${mouse.y * 25}px)`,
          transition: "transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      />

      {/* Glow 2 - Large, bottom-right, inverse direction */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          bottom: "-10%",
          right: "-5%",
          background: "radial-gradient(circle, rgba(0,122,255,0.12) 0%, transparent 70%)",
          transform: `translate(${mouse.x * -40}px, ${mouse.y * -35}px)`,
          transition: "transform 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      />

      {/* Glow 3 - Center accent, fast */}
      <div
        className="absolute w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{
          top: "35%",
          left: "40%",
          background: "radial-gradient(circle, rgba(0,122,255,0.08) 0%, transparent 70%)",
          transform: `translate(${mouse.x * 55}px, ${mouse.y * 50}px)`,
          transition: "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      />

      {/* === FLOATING GEOMETRIC ELEMENTS === */}

      {/* Ring 1 - top right */}
      <div
        className="absolute w-[120px] h-[120px] rounded-full border border-white/[0.04] pointer-events-none"
        style={{
          top: "15%",
          right: "18%",
          transform: `translate(${mouse.x * -50}px, ${mouse.y * 40}px)`,
          transition: "transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      />

      {/* Ring 2 - bottom left, larger */}
      <div
        className="absolute w-[200px] h-[200px] rounded-full border border-white/[0.03] pointer-events-none"
        style={{
          bottom: "12%",
          left: "8%",
          transform: `translate(${mouse.x * 35}px, ${mouse.y * -45}px)`,
          transition: "transform 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      />

      {/* Dot 1 - small bright */}
      <div
        className="absolute w-2 h-2 rounded-full pointer-events-none"
        style={{
          top: "25%",
          left: "20%",
          background: "rgba(0,122,255,0.4)",
          boxShadow: "0 0 15px rgba(0,122,255,0.3)",
          transform: `translate(${mouse.x * -65}px, ${mouse.y * 55}px)`,
          transition: "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      />

      {/* Dot 2 */}
      <div
        className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
        style={{
          top: "60%",
          right: "25%",
          background: "rgba(0,122,255,0.3)",
          boxShadow: "0 0 10px rgba(0,122,255,0.2)",
          transform: `translate(${mouse.x * 70}px, ${mouse.y * -60}px)`,
          transition: "transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      />

      {/* Dot 3 */}
      <div
        className="absolute w-1 h-1 rounded-full pointer-events-none"
        style={{
          top: "40%",
          right: "12%",
          background: "rgba(255,255,255,0.2)",
          transform: `translate(${mouse.x * -80}px, ${mouse.y * 70}px)`,
          transition: "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      />

      {/* Dot 4 */}
      <div
        className="absolute w-1 h-1 rounded-full pointer-events-none"
        style={{
          bottom: "30%",
          left: "30%",
          background: "rgba(255,255,255,0.15)",
          transform: `translate(${mouse.x * 55}px, ${mouse.y * -50}px)`,
          transition: "transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      />

      {/* Line 1 - diagonal, subtle */}
      <div
        className="absolute w-[100px] h-px pointer-events-none"
        style={{
          top: "30%",
          right: "10%",
          background: "linear-gradient(90deg, transparent, rgba(0,122,255,0.15), transparent)",
          transform: `translate(${mouse.x * -45}px, ${mouse.y * 35}px) rotate(45deg)`,
          transition: "transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      />

      {/* Line 2 */}
      <div
        className="absolute w-[80px] h-px pointer-events-none"
        style={{
          bottom: "35%",
          left: "12%",
          background: "linear-gradient(90deg, transparent, rgba(0,122,255,0.1), transparent)",
          transform: `translate(${mouse.x * 40}px, ${mouse.y * -30}px) rotate(-30deg)`,
          transition: "transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      />

      {/* Grid pattern - subtle parallax */}
      <div
        className="absolute inset-0 opacity-[0.018] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          transform: `translate(${mouse.x * 10}px, ${mouse.y * 10}px)`,
          transition: "transform 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      />

      {/* Radial light that follows mouse */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at ${50 + mouse.x * 20}% ${50 + mouse.y * 20}%, rgba(0,122,255,0.07), transparent 70%)`,
          transition: "background 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      />

      {/* === CONTENT === */}
      <div className="w-full max-w-[440px] mx-auto z-10 relative">
        {/* Logo / Brand */}
        <div className="text-center mb-10 animate-[fadeIn_0.5s_ease-out]">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-5 shadow-[0_0_30px_rgba(0,122,255,0.15)]">
            <BarChart3 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-white font-bold text-2xl tracking-tight">
            Dashboard Multi-Gateway
          </h1>
          <p className="text-gray-500 text-sm mt-2 font-light">
            Monitore suas vendas em tempo real
          </p>
        </div>

        {/* Login Card */}
        <div className="animate-[fadeIn_0.6s_ease-out_0.1s_both]">
          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium animate-[fadeIn_0.2s_ease-out]">
                  {error}
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-gray-600" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] transition-all duration-200"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-gray-600" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="w-full pl-11 pr-12 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] transition-all duration-200"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-[0_0_20px_rgba(0,122,255,0.2)] hover:shadow-[0_0_30px_rgba(0,122,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center animate-[fadeIn_0.6s_ease-out_0.2s_both]">
          <p className="text-[11px] text-gray-700 uppercase tracking-[0.2em]">
            &copy; 2025 Dashboard Multi-Gateway
          </p>
        </div>
      </div>
    </div>
  );
}
