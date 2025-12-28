import { orpc } from '@/lib/orpc';
import { formatBankName } from '@/lib/utils';
import { useSuspenseQuery } from '@tanstack/react-query';

export function useBanks() {
	return useSuspenseQuery(
		orpc.payment.getAllBanks.queryOptions({
			staleTime: Number.POSITIVE_INFINITY,
			select: (data) => {
				const seenCodes = new Set<string>();
				return data.banks
					.toSorted((a, b) =>
						a.name.localeCompare(b.name, undefined, {
							sensitivity: 'base',
						}),
					)
					.reduce(
						(acc, bank) => {
							if (!seenCodes.has(bank.code)) {
								seenCodes.add(bank.code);
								acc.push({
									code: bank.code,
									name: formatBankName(bank.name),
								});
							}
							return acc;
						},
						[] as Array<{ code: string; name: string }>,
					);
			},
		}),
	);
}
