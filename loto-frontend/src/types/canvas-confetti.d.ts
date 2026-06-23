declare module 'canvas-confetti' {
  interface ConfettiOptions {
    particleCount?: number;
    spread?: number;
    startVelocity?: number;
    origin?: { x?: number; y?: number };
  }

  type ConfettiFunction = (options?: ConfettiOptions) => Promise<null> | null;
  const confetti: ConfettiFunction;
  export default confetti;
}
