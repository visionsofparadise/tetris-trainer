interface IconProps {
	readonly size?: number;
}

function GlyphIcon({ size = 18, paths }: IconProps & { readonly paths: ReadonlyArray<string> }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			{paths.map((path) => (
				<path key={path} d={path} />
			))}
		</svg>
	);
}

const PLAY = ["M5 3l15 9-15 9v-6l5-3-5-3z"];
const CHECK = ["M2 12l3-3 4 4 10-10 3 3-13 13z"];
const CROSS = ["M3 6l3-3 6 6 6-6 3 3-6 6 6 6-3 3-6-6-6 6-3-3 6-6z"];
const BACK = ["M14 3h5l-8 9 8 9h-5l-8-9z"];
const REPLAY = ["M12 3a9 9 0 1 1-9 9h4a5 5 0 1 0 5-5v3L6 5l6-5z"];
const ARROW = ["M3 10h11V5l7 7-7 7v-5H3z"];
const INFO = ["M10 3h4v4h-4z", "M10 9h4v12h-4z"];
const SETTINGS = ["M9 2h6v6H9z", "M2 9h6v6H2z", "M16 9h6v6h-6z", "M9 16h6v6H9z", "M10.5 10.5h3v3h-3z"];
const PAUSE = ["M5 3h5v18H5z", "M14 3h5v18h-5z"];
const PREVIOUS = ["M21 10H10V5l-7 7 7 7v-5h11z"];

export const PlayIcon = (props: IconProps) => <GlyphIcon {...props} paths={PLAY} />;
export const CheckIcon = (props: IconProps) => <GlyphIcon {...props} paths={CHECK} />;
export const CrossIcon = (props: IconProps) => <GlyphIcon {...props} paths={CROSS} />;
export const BackIcon = (props: IconProps) => <GlyphIcon {...props} paths={BACK} />;
export const ReplayIcon = (props: IconProps) => <GlyphIcon {...props} paths={REPLAY} />;
export const ArrowIcon = (props: IconProps) => <GlyphIcon {...props} paths={ARROW} />;
export const PauseIcon = (props: IconProps) => <GlyphIcon {...props} paths={PAUSE} />;
export const PreviousIcon = (props: IconProps) => <GlyphIcon {...props} paths={PREVIOUS} />;
export const InfoIcon = (props: IconProps) => <GlyphIcon {...props} paths={INFO} />;
export const SettingsIcon = (props: IconProps) => <GlyphIcon {...props} paths={SETTINGS} />;

export function LogoMark() {
	return (
		<svg width="30" height="22" viewBox="0 0 30 22" fill="currentColor" aria-hidden="true">
			<path d="M0 2l2-2h7v9H0z" />
			<rect x="10.5" y="0" width="9" height="9" />
			<path d="M21 0h7l2 2v7h-9z" />
			<rect x="10.5" y="11" width="9" height="9" />
		</svg>
	);
}

export function CornerCross() {
	return (
		<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
			<path d="M7 0v14M0 7h14" stroke="rgb(255 255 255 / 45%)" strokeWidth="1" />
		</svg>
	);
}

export function MinimiseIcon() {
	return (
		<svg
			width="12"
			height="12"
			viewBox="0 0 12 12"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.4"
			aria-hidden="true"
		>
			<path d="M1 6h10" />
		</svg>
	);
}

export function RestoreIcon() {
	return (
		<svg
			width="12"
			height="12"
			viewBox="0 0 12 12"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.4"
			aria-hidden="true"
		>
			<rect x="1.5" y="3.5" width="7" height="7" />
			<path d="M3.5 3.5V1.5h7v7h-2" />
		</svg>
	);
}

export function MaximiseIcon() {
	return (
		<svg
			width="12"
			height="12"
			viewBox="0 0 12 12"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.4"
			aria-hidden="true"
		>
			<rect x="1.5" y="1.5" width="9" height="9" />
		</svg>
	);
}

export function CloseIcon() {
	return (
		<svg
			width="12"
			height="12"
			viewBox="0 0 12 12"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.4"
			aria-hidden="true"
		>
			<path d="M1.5 1.5l9 9M10.5 1.5l-9 9" />
		</svg>
	);
}
