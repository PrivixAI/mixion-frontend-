import React, { useEffect, useRef, useState } from "react";

interface FuzzyTextProps {
  children: React.ReactNode;
  fontSize?: number | string;
  fontWeight?: string | number;
  fontFamily?: string;
  color?: string;
  enableHover?: boolean;
  baseIntensity?: number;
  hoverIntensity?: number;
  maxWidth?: number;
}

const FuzzyText: React.FC<FuzzyTextProps> = ({
  children,
  fontSize = "clamp(1.5rem, 5vw, 3rem)",
  fontWeight = 900,
  fontFamily = "inherit",
  color = "#fff",
  enableHover = true,
  baseIntensity = 0.18,
  hoverIntensity = 0.5,
  maxWidth = 800,
}) => {
  const canvasRef = useRef<HTMLCanvasElement & { cleanupFuzzyText?: () => void }>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState<number>(0);

  useEffect(() => {
    let animationFrameId: number;
    let isCancelled = false;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const updateCanvasWidth = () => {
      const containerWidth = container.getBoundingClientRect().width;
      setCanvasWidth(Math.min(containerWidth, maxWidth));
    };

    updateCanvasWidth();
    const resizeObserver = new ResizeObserver(updateCanvasWidth);
    resizeObserver.observe(container);

    const init = async () => {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      if (isCancelled) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const computedFontFamily =
        fontFamily === "inherit"
          ? window.getComputedStyle(canvas).fontFamily || "sans-serif"
          : fontFamily;

      const fontSizeStr =
        typeof fontSize === "number" ? `${fontSize}px` : fontSize;
      let numericFontSize: number;
      if (typeof fontSize === "number") {
        numericFontSize = fontSize;
      } else {
        const temp = document.createElement("span");
        temp.style.fontSize = fontSize;
        document.body.appendChild(temp);
        const computedSize = window.getComputedStyle(temp).fontSize;
        numericFontSize = parseFloat(computedSize);
        document.body.removeChild(temp);
      }

      const text = React.Children.toArray(children).join("");
      const words = text.split(" ");
      const isSmallScreen = canvasWidth < 768; // Breakpoint for small screens
      const maxLineWidth = isSmallScreen ? canvasWidth - 100 : canvasWidth; // Dynamic width

      const offscreen = document.createElement("canvas");
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return;

      offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;
      offCtx.textBaseline = "alphabetic";

      // Split text into lines only on small screens
      const lines: string[] = isSmallScreen
        ? []
        : [text]; // Single line on large screens
      if (isSmallScreen) {
        let currentLine = "";
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const metrics = offCtx.measureText(testLine);
          if (metrics.width > maxLineWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);
      }

      // Measure each line for canvas sizing
      let maxTextWidth = 0;
      const lineMetrics = lines.map((line) => {
        const metrics = offCtx.measureText(line);
        const width = Math.ceil((metrics.actualBoundingBoxRight ?? metrics.width) + (metrics.actualBoundingBoxLeft ?? 0));
        maxTextWidth = Math.max(maxTextWidth, width);
        return {
          text: line,
          width,
          ascent: metrics.actualBoundingBoxAscent ?? numericFontSize,
          descent: metrics.actualBoundingBoxDescent ?? numericFontSize * 0.2,
          actualBoundingBoxLeft: metrics.actualBoundingBoxLeft ?? 0,
        };
      });

      const lineHeight = numericFontSize * 1.2;
      const totalHeight = lineMetrics.length * lineHeight;
      const extraWidthBuffer = 10;
      const offscreenWidth = maxTextWidth + extraWidthBuffer;
      const offscreenHeight = totalHeight;

      offscreen.width = offscreenWidth;
      offscreen.height = offscreenHeight;

      // Draw each line on the offscreen canvas
      offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;
      offCtx.textBaseline = "alphabetic";
      offCtx.fillStyle = color;
      lineMetrics.forEach((line, index) => {
        const xOffset = extraWidthBuffer / 2 - (lineMetrics[index].actualBoundingBoxLeft ?? 0);
        const yOffset = (index + 1) * lineHeight - line.descent;
        offCtx.fillText(line.text, xOffset, yOffset);
      });

      const horizontalMargin = 50;
      const verticalMargin = 20;
      canvas.width = offscreenWidth + horizontalMargin * 2;
      canvas.height = offscreenHeight + verticalMargin * 2;
      ctx.translate(horizontalMargin, verticalMargin);

      const interactiveAreas = lineMetrics.map((line, index) => ({
        left: horizontalMargin + extraWidthBuffer / 2,
        right: horizontalMargin + extraWidthBuffer / 2 + line.width,
        top: verticalMargin + index * lineHeight,
        bottom: verticalMargin + (index + 1) * lineHeight,
      }));

      let isHovering = false;
      const fuzzRange = 30;

      const run = () => {
        if (isCancelled) return;
        ctx.clearRect(
          -fuzzRange,
          -fuzzRange,
          offscreenWidth + 2 * fuzzRange,
          offscreenHeight + 2 * fuzzRange
        );
        const intensity = isHovering ? hoverIntensity : baseIntensity;
        for (let j = 0; j < offscreenHeight; j++) {
          const dx = Math.floor(intensity * (Math.random() - 0.5) * fuzzRange);
          ctx.drawImage(
            offscreen,
            0,
            j,
            offscreenWidth,
            1,
            dx,
            j,
            offscreenWidth,
            1
          );
        }
        animationFrameId = window.requestAnimationFrame(run);
      };

      run();

      const isInsideTextArea = (x: number, y: number) =>
        interactiveAreas.some(
          (area) =>
            x >= area.left &&
            x <= area.right &&
            y >= area.top &&
            y <= area.bottom
        );

      const handleMouseMove = (e: MouseEvent) => {
        if (!enableHover) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        isHovering = isInsideTextArea(x, y);
      };

      const handleMouseLeave = () => {
        isHovering = false;
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (!enableHover) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        isHovering = isInsideTextArea(x, y);
      };

      const handleTouchEnd = () => {
        isHovering = false;
      };

      if (enableHover) {
        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseleave", handleMouseLeave);
        canvas.addEventListener("touchmove", handleTouchMove, {
          passive: false,
        });
        canvas.addEventListener("touchend", handleTouchEnd);
      }

      const cleanup = () => {
        window.cancelAnimationFrame(animationFrameId);
        if (enableHover) {
          canvas.removeEventListener("mousemove", handleMouseMove);
          canvas.removeEventListener("mouseleave", handleMouseLeave);
          canvas.removeEventListener("touchmove", handleTouchMove);
          canvas.removeEventListener("touchend", handleTouchEnd);
        }
      };

      canvas.cleanupFuzzyText = cleanup;
    };

    init();

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(animationFrameId);
      if (canvas && canvas.cleanupFuzzyText) {
        canvas.cleanupFuzzyText();
      }
      resizeObserver.disconnect();
    };
  }, [
    children,
    fontSize,
    fontWeight,
    fontFamily,
    color,
    enableHover,
    baseIntensity,
    hoverIntensity,
    canvasWidth,
  ]);

  return (
    <div ref={containerRef} style={{ width: "100%", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%" }} />
    </div>
  );
};

export default FuzzyText;