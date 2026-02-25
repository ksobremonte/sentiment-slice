import { motion, type HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

// Fade up on scroll
export const FadeIn = ({
  children,
  delay = 0,
  className = "",
  ...props
}: { children: ReactNode; delay?: number; className?: string } & Omit<HTMLMotionProps<"div">, "children">) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
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
    whileHover={{ y: -4, boxShadow: "0 20px 40px -12px hsl(20 30% 15% / 0.15)" }}
    transition={{ duration: 0.25, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

// Staggered container
export const StaggerContainer = ({
  children,
  className = "",
  staggerDelay = 0.1,
}: { children: ReactNode; className?: string; staggerDelay?: number }) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-50px" }}
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
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
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
    transition={{ duration: 0.4, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

// Animated button wrapper
export const AnimatedButton = ({
  children,
  className = "",
}: { children: ReactNode; className?: string }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={className}
  >
    {children}
  </motion.div>
);
