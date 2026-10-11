import { useId } from 'react';
export default function Loader({ className = 'h-10 w-10 text-brand', label = 'در حال بارگذاری' }: { className?: string; label?: string }) {
  const id = useId();
  return <span role="status" aria-label={label} className={`promty-loader ${className}`}>
    {[0, 1, 2].map(index => { const prefix = `${id}-${index}-`; return <span key={index} aria-hidden="true"><svg className="promty-loader-shape" style={{ animationDelay: `${index * 0.3}s` }} xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100">
          <defs>
            <filter id={`${prefix}shine`}>
              <feGaussianBlur stdDeviation={3} />
            </filter>
            <mask id={`${prefix}mask`}>
              <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="white" />
            </mask>
            <radialGradient id={`${prefix}gradient-1`} cx={50} cy={66} fx={50} fy={66} r={30} gradientTransform="translate(0 35) scale(1 0.5)" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="black" stopOpacity="0.3" />
              <stop offset="50%" stopColor="black" stopOpacity="0.1" />
              <stop offset="100%" stopColor="black" stopOpacity={0} />
            </radialGradient>
            <radialGradient id={`${prefix}gradient-2`} cx={55} cy={20} fx={55} fy={20} r={30} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="white" stopOpacity="0.3" />
              <stop offset="50%" stopColor="white" stopOpacity="0.1" />
              <stop offset="100%" stopColor="white" stopOpacity={0} />
            </radialGradient>
            <radialGradient id={`${prefix}gradient-3`} cx={85} cy={50} fx={85} fy={50} href={`#${prefix}gradient-2`} />
            <radialGradient id={`${prefix}gradient-4`} cx={50} cy={58} fx={50} fy={58} r={60} gradientTransform="translate(0 47) scale(1 0.2)" href={`#${prefix}gradient-3`} />
            <linearGradient id={`${prefix}gradient-5`} x1={50} y1={90} x2={50} y2={10} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="black" stopOpacity="0.2" />
              <stop offset="40%" stopColor="black" stopOpacity={0} />
            </linearGradient>
          </defs>
          <g>
            <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="currentColor" />
            <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill={`url(#${prefix}gradient-1)`} />
            <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="none" stroke="white" opacity="0.3" strokeWidth={3} filter={`url(#${prefix}shine)`} mask={`url(#${prefix}mask)`} />
            <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill={`url(#${prefix}gradient-2)`} />
            <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill={`url(#${prefix}gradient-3)`} />
            <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill={`url(#${prefix}gradient-4)`} />
            <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill={`url(#${prefix}gradient-5)`} />
          </g>
        </svg></span>; })}
  </span>;
}
