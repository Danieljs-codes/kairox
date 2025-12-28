import IconCircleHashtag from '@icons/circle-hashtag.svg';
import IconUserSearch from '@icons/user-search.svg';
import IconVault from '@icons/vault.svg';
import {
	AlertDialog,
	AlertDialogClose,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogPopup,
	AlertDialogTitle,
} from '@ui/alert-dialog';
import { Button } from '@ui/button';
import { Spinner } from '@ui/spinner';

type BankAccountConfirmationProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	accountName: string;
	accountNumber: string;
	bankName: string;
	onConfirm: () => void;
	isLoading?: boolean;
};

export function BankAccountConfirmation({
	open,
	onOpenChange,
	accountName,
	accountNumber,
	bankName,
	onConfirm,
	isLoading,
}: BankAccountConfirmationProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogPopup>
				<AlertDialogHeader>
					<AlertDialogTitle>Confirm Bank Account</AlertDialogTitle>
					<AlertDialogDescription>
						Please verify that the following account details are correct before proceeding.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="px-6 pb-4">
					<div className="rounded-xl border bg-linear-to-br from-muted/30 to-muted/60 p-1">
						<div className="rounded-lg bg-background/80 backdrop-blur-sm divide-y divide-border">
							<div className="flex items-center gap-3 px-4 py-3">
								<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
									<IconUserSearch />
								</div>
								<div className="flex flex-col min-w-0">
									<span className="text-xs text-muted-foreground">Account Name</span>
									<span className="font-medium text-sm truncate">{accountName}</span>
								</div>
							</div>
							<div className="flex items-center gap-3 px-4 py-3">
								<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
									<IconCircleHashtag />
								</div>
								<div className="flex flex-col min-w-0">
									<span className="text-xs text-muted-foreground">Account Number</span>
									<span className="font-medium text-sm font-mono tracking-wide">
										{accountNumber}
									</span>
								</div>
							</div>
							<div className="flex items-center gap-3 px-4 py-3">
								<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
									<IconVault />
								</div>
								<div className="flex flex-col min-w-0">
									<span className="text-xs text-muted-foreground">Bank</span>
									<span className="font-medium text-sm truncate">{bankName}</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<AlertDialogFooter>
					<AlertDialogClose render={<Button variant="outline" disabled={isLoading} />}>
						Cancel
					</AlertDialogClose>
					<Button onClick={onConfirm} disabled={isLoading}>
						{isLoading && <Spinner />}
						{isLoading ? 'Creating...' : 'Confirm & Continue'}
					</Button>
				</AlertDialogFooter>
			</AlertDialogPopup>
		</AlertDialog>
	);
}
