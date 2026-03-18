import React from 'react';

const ViberIcon = ({
  size = undefined,
  color = '#000000',
  strokeWidth = 2,
  background = 'transparent',
  opacity = 1,
  rotation = 0,
  shadow = 0,
  flipHorizontal = false,
  flipVertical = false,
  padding = 0
}) => {
  const transforms = [];
  if (rotation !== 0) transforms.push(`rotate(${rotation}deg)`);
  if (flipHorizontal) transforms.push('scaleX(-1)');
  if (flipVertical) transforms.push('scaleY(-1)');

  const viewBoxSize = 24 + (padding * 2);
  const viewBoxOffset = -padding;
  const viewBox = `${viewBoxOffset} ${viewBoxOffset} ${viewBoxSize} ${viewBoxSize}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        opacity,
        transform: transforms.join(' ') || undefined,
        filter: shadow > 0 ? `drop-shadow(0 ${shadow}px ${shadow * 2}px rgba(0,0,0,0.3))` : undefined,
        backgroundColor: background !== 'transparent' ? background : undefined
      }}
    >
      <path
        d="M4.5 2.25a0.94 0.94 0 0 0-0.96 0.94v15.035A0.94 0.94 0 0 0 4.5 19.165h0.94v2.585l5.17-2.585H19.5a0.94 0.94 0 0 0 0.94-0.94V3.19A0.94 0.94 0 0 0 19.5 2.25Zm2.35 3.29h2.8a0.5 0.5 0 0 1 0.47 0.47a5.05 5.05 0 0 0 0.315 1.88a0.925 0.925 0 0 1-0.315 1.175l-1 1a9 9 0 0 0 1.69 2.3a9.5 9.5 0 0 0 2.305 1.695l1-1a0.925 0.925 0 0 1 1.175-0.315a5.05 5.05 0 0 0 1.88 0.315a0.5 0.5 0 0 1 0.47 0.47v2.82a0.5 0.5 0 0 1-0.47 0.47A11.265 11.265 0 0 1 6.36 6a0.5 0.5 0 0 1 0.47-0.46Z"
      />
    </svg>
  );
};

export default ViberIcon;
