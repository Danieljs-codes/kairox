import { useAppForm } from '@/components/form-factory';
import { EventDescriptionEditor } from '@/components/organizer/event-description-editor';
import { eventDetailsSchema, type EventDetailsInput } from '@kairox/schema/event';
import { revalidateLogic } from '@tanstack/react-form';

export const EventDetails = () => {
	const form = useAppForm({
		defaultValues: {
			title: '',
			slug: '',
			description: '',
			address: '',
			startDate: null,
			endDate: null,
			timezone: 'UTC',
			feeBearer: 'CUSTOMER',
		} as EventDetailsInput,
		validationLogic: revalidateLogic(),
		validators: {
			onDynamic: eventDetailsSchema,
		},
	});
	return (
		<form
			className="flex flex-col gap-y-6"
			onSubmit={(event) => {
				event.preventDefault();
				event.stopPropagation();
				form.handleSubmit();
			}}
		>
			<form.AppField
				name="title"
				children={(field) => <field.TextField label="Title" placeholder="" />}
			/>
			<form.Field name="description" children={(field) => <EventDescriptionEditor />} />
		</form>
	);
};
