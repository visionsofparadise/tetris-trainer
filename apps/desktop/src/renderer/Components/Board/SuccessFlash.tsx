import { CheckIcon } from "../UI/Icons";

export function SuccessFlash() {
	return (
		<div className="pointer-events-none absolute -inset-2.5" role="status">
			<span className="sr-only">Cleared</span>
			<div className="success-ring absolute inset-0" aria-hidden="true" />
			<div className="absolute inset-x-0 top-[34%] flex justify-center" aria-hidden="true">
				<div className="success-check flex size-16 items-center justify-center bg-lime text-ink chamfer-14">
					<CheckIcon size={30} />
				</div>
			</div>
		</div>
	);
}
