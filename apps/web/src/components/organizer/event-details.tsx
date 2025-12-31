import { useAppForm } from '@/components/form-factory';
import { EventDescriptionEditor } from '@/components/organizer/event-description-editor';
import {
	generateGroupedTimeZoneTags,
	generateTimeSlots,
	getTimeFromDate,
	mergeTimeIntoDate,
	toJSDate,
	type Tag,
	type TagGroup,
} from '@/lib/dates';
import { orpc } from '@/lib/orpc';
import { cn } from '@/lib/utils';
import IconChevronExpandY from '@icons/chevron-expand-y.svg';
import { eventDetailsSchema, type EventDetailsInput } from '@kairox/schema/event';
import { isDefinedError } from '@orpc/client';
import { revalidateLogic } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { useMatch, useParams, useRouteContext, useRouter } from '@tanstack/react-router';
import { Button } from '@ui/button';
import { Calendar } from '@ui/calendar';
import {
	Combobox,
	ComboboxCollection,
	ComboboxEmpty,
	ComboboxGroup,
	ComboboxGroupLabel,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxPopup,
	ComboboxSeparator,
} from '@ui/combobox';
import { Field, FieldError, FieldLabel } from '@ui/field';
import { Group, GroupSeparator, GroupText } from '@ui/group';
import { Input } from '@ui/input';
import { Label } from '@ui/label';
import { Popover, PopoverPopup, PopoverTrigger } from '@ui/popover';
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@ui/select';
import { Spinner } from '@ui/spinner';
import { toastManager } from '@ui/toast';
import { format } from 'date-fns';
import React from 'react';

const times = [{ label: 'Pick a time', value: '' }, ...generateTimeSlots(30)];
const timezones = generateGroupedTimeZoneTags();
const timezoneLookup = new Map(
	timezones.flatMap((group) => group.items).map((item) => [item.value, item]),
);

export const EventDetails = () => {
	const { fullPath } = useMatch({ from: '/organizer/events/$id/create-event' });
	const params = useParams({ from: '/organizer/events/$id/create-event' });
	const router = useRouter();
	const { event } = useRouteContext({
		from: '/organizer/events/$id/create-event',
		select: (s) => s.event,
	});
	const { mutateAsync: saveEventDetails } = useMutation(
		orpc.event.saveEventDetails.mutationOptions({
			onSuccess: async () => {
				await router.invalidate({
					filter: (match) => match.fullPath === fullPath,
					sync: true,
				});

				toastManager.add({
					title: 'Success',
					description: 'Details saved successfully. Continue to next step.',
					type: 'success',
				});

				await router.navigate({
					to: '/organizer/events/$id/create-event',
					params: { id: params.id },
					search: { step: 'tickets' },
				});
			},
			onError: (error) => {
				if (!isDefinedError(error)) {
					toastManager.add({
						title: 'Error',
						description: 'Failed to save. Please try again.',
						type: 'error',
					});
					return;
				}

				console.log('onError', error);
			},
		}),
	);

	const form = useAppForm({
		defaultValues: event
			? {
					id: params.id,
					title: event.title,
					slug: event.slug,
					description: event.description ?? '',
					address: event.venueAddress,
					startDate: new Date(event.startDate),
					endDate: new Date(event.endDate),
					timezone: event.timezone,
				}
			: ({
					id: params.id,
					title: '',
					slug: null,
					description: '',
					address: '',
					startDate: null,
					endDate: null,
					timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
				} as EventDetailsInput),
		validationLogic: revalidateLogic(),
		validators: {
			onDynamic: eventDetailsSchema,
			onSubmitAsync: async ({ value }) => {
				try {
					await saveEventDetails({
						...value,
						id: params.id,
					});
				} catch (err) {
					if (isDefinedError(err) && (err as any).code === 'SLUG_ALREADY_TAKEN') {
						return {
							fields: {
								slug: 'Slug is already taken. Please choose another.',
							},
						};
					}
					throw err;
				}
			},
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
				children={(field) => (
					<field.TextField label="Event Name" placeholder="e.g. Design Systems Workshop" />
				)}
			/>
			<form.Field
				name="description"
				children={(field) => (
					<Field>
						<FieldLabel>Event description</FieldLabel>
						<EventDescriptionEditor
							onUpdate={field.handleChange}
							content={field.state.value || ''}
							placeholder="Describe what your event is about..."
							invalid={!field.state.meta.isValid}
						/>
						<FieldError match={!field.state.meta.isValid}>
							{typeof field.state.meta.errors[0] === 'string'
								? field.state.meta.errors[0]
								: field.state.meta.errors[0]?.message}
						</FieldError>
					</Field>
				)}
			/>
			{/* Start Date & Time */}
			<div className="flex items-center gap-x-2">
				<form.AppField
					name="startDate"
					children={(field) => (
						<Field
							className="w-full"
							name={field.name}
							invalid={!field.state.meta.isValid}
							dirty={field.state.meta.isDirty}
							touched={field.state.meta.isTouched}
						>
							<FieldLabel>Start Date</FieldLabel>
							<Popover>
								<PopoverTrigger
									render={
										<Button
											aria-invalid={!field.state.meta.isValid}
											className={cn(
												'w-full select-none justify-between font-normal',
												!field.state.meta.isValid && 'border-destructive/32',
												!field.state.value && 'text-muted-foreground',
											)}
											size="lg"
											id="start-date-picker"
											variant={field.state.meta.isValid ? 'outline' : 'destructive-outline'}
										>
											{field.state.value
												? format(toJSDate(field.state.value)!, 'do MMMM, yyyy')
												: 'Pick a date'}
											<IconChevronExpandY className="text-foreground" />
										</Button>
									}
								/>
								<PopoverPopup className="min-w-auto p-0" viewportClassName="py-0 px-0" side="top">
									<div className="w-fit">
										<Calendar
											className="bg-transparent p-2"
											fixedWeeks
											mode="single"
											onSelect={(val) => {
												// Preserve existing time when selecting a new date
												const existingTime = getTimeFromDate(field.state.value);
												const newDate = mergeTimeIntoDate(val, existingTime);
												field.handleChange(newDate ?? val ?? null);
											}}
											selected={toJSDate(field.state.value)}
											showOutsideDays
										/>
									</div>
								</PopoverPopup>
							</Popover>
							<FieldError match={!field.state.meta.isValid}>
								{typeof field.state.meta.errors[0] === 'string'
									? field.state.meta.errors[0]
									: field.state.meta.errors[0]?.message}
							</FieldError>
						</Field>
					)}
				/>
				<form.AppField
					name="startDate"
					children={(field) => (
						<Field
							name={field.name}
							invalid={!field.state.meta.isValid}
							dirty={field.state.meta.isDirty}
							touched={field.state.meta.isTouched}
							className="w-full"
						>
							<FieldLabel>Start Time</FieldLabel>
							<Select
								disabled={!field.state.value}
								items={times}
								value={getTimeFromDate(field.state.value)}
								onValueChange={(time) => {
									const merged = mergeTimeIntoDate(field.state.value, time);
									if (merged) field.handleChange(merged);
								}}
							>
								<SelectTrigger size="lg" onBlur={field.handleBlur}>
									<SelectValue />
								</SelectTrigger>
								<SelectPopup>
									{times.map(({ label, value }) => (
										<SelectItem key={value} value={value}>
											{label}
										</SelectItem>
									))}
								</SelectPopup>
							</Select>
						</Field>
					)}
				/>
			</div>

			<div className="flex items-center gap-x-2">
				<form.AppField
					name="endDate"
					children={(field) => (
						<Field
							className="w-full"
							name={field.name}
							invalid={!field.state.meta.isValid}
							dirty={field.state.meta.isDirty}
							touched={field.state.meta.isTouched}
						>
							<FieldLabel>End Date</FieldLabel>
							<Popover>
								<PopoverTrigger
									render={
										<Button
											aria-invalid={!field.state.meta.isValid}
											className={cn(
												'w-full select-none justify-between font-normal',
												!field.state.meta.isValid && 'border-destructive/32',
												!field.state.value && 'text-muted-foreground',
											)}
											size="lg"
											id="end-date-picker"
											variant={field.state.meta.isValid ? 'outline' : 'destructive-outline'}
										>
											{field.state.value
												? format(toJSDate(field.state.value)!, 'do MMMM, yyyy')
												: 'Pick a date'}
											<IconChevronExpandY className="text-foreground" />
										</Button>
									}
								/>
								<PopoverPopup className="min-w-auto p-0" viewportClassName="py-0 px-0" side="top">
									<div className="w-fit">
										<Calendar
											className="bg-transparent p-2"
											fixedWeeks
											mode="single"
											onSelect={(val) => {
												// Preserve existing time when selecting a new date
												const existingTime = getTimeFromDate(field.state.value);
												const newDate = mergeTimeIntoDate(val, existingTime);
												field.handleChange(newDate ?? val ?? null);
											}}
											selected={toJSDate(field.state.value)}
											showOutsideDays
										/>
									</div>
								</PopoverPopup>
							</Popover>
							<FieldError match={!field.state.meta.isValid}>
								{typeof field.state.meta.errors[0] === 'string'
									? field.state.meta.errors[0]
									: field.state.meta.errors[0]?.message}
							</FieldError>
						</Field>
					)}
				/>
				<form.AppField
					name="endDate"
					children={(field) => (
						<Field
							className="w-full"
							name={field.name}
							invalid={!field.state.meta.isValid}
							dirty={field.state.meta.isDirty}
							touched={field.state.meta.isTouched}
						>
							<FieldLabel>End Time</FieldLabel>
							<Select
								disabled={!field.state.value}
								items={times}
								value={getTimeFromDate(field.state.value)}
								onValueChange={(time) => {
									const merged = mergeTimeIntoDate(field.state.value, time);
									if (merged) field.handleChange(merged);
								}}
							>
								<SelectTrigger size="lg" onBlur={field.handleBlur}>
									<SelectValue />
								</SelectTrigger>
								<SelectPopup>
									{times.map(({ label, value }) => (
										<SelectItem key={value} value={value}>
											{label}
										</SelectItem>
									))}
								</SelectPopup>
							</Select>
						</Field>
					)}
				/>
			</div>

			<form.AppField
				name="slug"
				children={(field) => (
					<Field
						dirty={field.state.meta.isDirty}
						invalid={!field.state.meta.isValid}
						name={field.name}
						touched={field.state.meta.isTouched}
					>
						<FieldLabel>Event slug</FieldLabel>
						<Group aria-label="Domain input">
							<GroupText render={<Label aria-label="Domain" htmlFor="domain" />}>
								kairox.com/discover
							</GroupText>
							<GroupSeparator />
							<Input
								placeholder="my-event-name"
								type="text"
								size="lg"
								onBlur={field.handleBlur}
								onValueChange={(val) => {
									if (val === '') {
										field.handleChange(null);
										return;
									}
									field.handleChange(val);
								}}
								value={field.state.value ?? ''}
							/>
						</Group>
						<FieldError match={!field.state.meta.isValid}>
							{typeof field.state.meta.errors[0] === 'string'
								? field.state.meta.errors[0]
								: field.state.meta.errors[0]?.message}
						</FieldError>
					</Field>
				)}
			/>

			<form.AppField
				name="address"
				children={(field) => (
					<field.TextField label="Event Address" placeholder="e.g. 123 Main St, City, State" />
				)}
			/>

			<form.Field
				name="timezone"
				children={(field) => (
					<Field
						name={field.name}
						invalid={!field.state.meta.isValid}
						dirty={field.state.meta.isDirty}
						touched={field.state.meta.isTouched}
						className="w-full"
					>
						<FieldLabel>Timezone</FieldLabel>
						<Combobox
							filter={(tag, query) => {
								const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
								const q = normalize(query);
								return (
									normalize(tag.label).includes(q) ||
									normalize(tag.group).includes(q) ||
									normalize(tag.value).includes(q)
								);
							}}
							autoHighlight
							items={timezones}
							value={timezoneLookup.get(field.state.value) ?? null}
							onValueChange={(val) => {
								field.handleChange(val?.value ?? '');
							}}
						>
							<div className="flex flex-col items-start gap-2 w-full">
								<ComboboxInput
									aria-label="Search tags"
									placeholder="Search for a city or timezone..."
									size="lg"
									onBlur={field.handleBlur}
									showClear
								/>
							</div>
							<ComboboxPopup>
								<ComboboxEmpty>No tags found.</ComboboxEmpty>
								<ComboboxList>
									{(group: TagGroup) => (
										<React.Fragment key={group.value}>
											<ComboboxGroup items={group.items}>
												<ComboboxGroupLabel>{group.value}</ComboboxGroupLabel>
												<ComboboxCollection>
													{(tag: Tag) => (
														<ComboboxItem key={tag.id} value={tag}>
															{tag.label}
														</ComboboxItem>
													)}
												</ComboboxCollection>
											</ComboboxGroup>
											<ComboboxSeparator />
										</React.Fragment>
									)}
								</ComboboxList>
							</ComboboxPopup>
						</Combobox>
						<FieldError match={!field.state.meta.isValid}>
							{typeof field.state.meta.errors[0] === 'string'
								? field.state.meta.errors[0]
								: field.state.meta.errors[0]?.message}
						</FieldError>
					</Field>
				)}
			/>

			<form.Subscribe
				selector={(state) => [state.isSubmitting]}
				children={([isSubmitting]) => (
					<Button type="submit" disabled={isSubmitting} size="lg">
						{isSubmitting && <Spinner />}
						{isSubmitting ? 'Continuing...' : 'Save and Continue'}
					</Button>
				)}
			/>
		</form>
	);
};
