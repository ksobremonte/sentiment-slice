import { motion, useScroll, useTransform, type HTMLMotionProps } from "framer-motion";
import { ReactNode, useRef, useEffect, useState } from "react";

// Fade up on scroll
export const FadeIn = ({
  children,
  delay = 0,
  className = "",
  ...props
}: { children: ReactNode; delay?: number; className?: string } & Omit<HTMLMotionProps<"div">, "children">) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// Scale on hover card
export const HoverCard = ({
  children,
  className = "",
}: { children: ReactNode; className?: string }) => (
  <motion.div
    whileHover={{ y: -6, boxShadow: "0 24px 48px -12px hsl(20 30% 15% / 0.18)" }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

// Staggered container
export const StaggerContainer = ({
  children,
  className = "",
  staggerDelay = 0.08,
}: { children: ReactNode; className?: string; staggerDelay?: number }) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-60px" }}
    variants={{
      hidden: {},
      visible: { transition: { staggerChildren: staggerDelay } },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({
  children,
  className = "",
}: { children: ReactNode; className?: string }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 24 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Page wrapper with transition
export const PageTransition = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

// Animated button wrapper with glow
export const AnimatedButton = ({
  children,
  className = "",
}: { children: ReactNode; className?: string }) => (
  <motion.div
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    transition={{ duration: 0.2 }}
    className={className}
  >
    {children}
  </motion.div>
);

// Parallax section — moves content at a different rate than scroll
export const ParallaxSection = ({
  children,
  className = "",
  speed = 0.3,
}: { children: ReactNode; className?: string; speed?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [speed * 100, speed * -100]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div style={{ y }}>
        {children}
      </motion.div>
    </div>
  );
};

// Parallax image background
export const ParallaxImage = ({
  src,
  alt,
  className = "",
  overlay = true,
}: { src: string; alt: string; className?: string; overlay?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.img
        src={src}
        alt={alt}
        style={{ y }}
        className="absolute inset-0 w-full h-full object-cover scale-[1.2]"
      />
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-foreground/70" />
      )}
    </div>
  );
};

// Image hover zoom
export const ZoomImage = ({
  src,
  alt,
  className = "",
  loading = "lazy" as "lazy" | "eager",
  fetchPriority,
  width,
  height,
}: { src: string; alt: string; className?: string; loading?: "lazy" | "eager"; fetchPriority?: "high" | "low" | "auto"; width?: number; height?: number }) => (
  <div className={`overflow-hidden ${className}`}>
    <motion.img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      loading={loading}
      // @ts-ignore
      fetchpriority={fetchPriority}
      width={width}
      height={height}
      whileHover={{ scale: 1.08 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    />
  </div>
);

// Animated counter
export const AnimatedCounter = ({
  target,
  suffix = "",
  prefix = "",
  duration = 2,
  className = "",
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}) => {
  const [count, setCount] = useState(0);
  const [animatedTarget, setAnimatedTarget] = useState(0);
  const isVisible = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Re-animate when target changes and element is visible (or was already visible)
    if (target !== animatedTarget && (target > 0 || animatedTarget > 0)) {
      if (isVisible.current) {
        setAnimatedTarget(target);
        const startTime = performance.now();
        const startCount = count;
        const animate = (currentTime: number) => {
          const elapsed = (currentTime - startTime) / 1000;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round((startCount + (target - startCount) * eased) * 10) / 10);
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }
  }, [target]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible.current = entry.isIntersecting;
        if (entry.isIntersecting && animatedTarget !== target) {
          setAnimatedTarget(target);
          const startTime = performance.now();
          const animate = (currentTime: number) => {
            const elapsed = (currentTime - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target * 10) / 10);
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{count}{suffix}
    </span>
  );
};

// Floating element animation
export const FloatingElement = ({
  children,
  className = "",
  delay = 0,
}: { children: ReactNode; className?: string; delay?: number }) => (
  <motion.div
    animate={{ y: [0, -8, 0] }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
    className={className}
  >
    {children}
  </motion.div>
);

// Reveal text animation
export const RevealText = ({
  children,
  className = "",
  delay = 0,
}: { children: ReactNode; className?: string; delay?: number }) => (
  <div className="overflow-hidden">
    <motion.div
      initial={{ y: "100%" }}
      whileInView={{ y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  </div>
);
