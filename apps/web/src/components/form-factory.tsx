import { createFormHook, createFormHookContexts } from '@tanstack/react-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@ui/field';
import { Input, type InputProps } from '@ui/input';
import { Textarea, type TextareaProps } from '@ui/textarea';

export const { fieldContext, formContext, useFieldContext, useFormContext } =
	createFormHookContexts();

export function TextField({
	label,
	description,
	...props
}: {
	label?: string;
	description?: string;
} & InputProps) {
	const field = useFieldContext<string>();
	return (
		<Field
			dirty={field.state.meta.isDirty}
			invalid={!field.state.meta.isValid}
			name={field.name}
			touched={field.state.meta.isTouched}
		>
			{label && <FieldLabel className="font-medium">{label}</FieldLabel>}
			<Input
				{...props}
				onBlur={field.handleBlur}
				onValueChange={field.handleChange}
				value={field.state.value}
				size="lg"
			/>
			{description && <FieldDescription>{description}</FieldDescription>}
			<FieldError match={!field.state.meta.isValid}>
				{field.state.meta.errors[0]?.message}
			</FieldError>
		</Field>
	);
}

export function TextareaField({
	label,
	description,
	...props
}: {
	label?: string;
	description?: string;
} & TextareaProps) {
	const field = useFieldContext<string>();
	return (
		<Field
			dirty={field.state.meta.isDirty}
			invalid={!field.state.meta.isValid}
			name={field.name}
			touched={field.state.meta.isTouched}
		>
			{label && <FieldLabel className="font-medium">{label}</FieldLabel>}
			<Textarea
				{...props}
				onBlur={field.handleBlur}
				onChange={(e) => field.handleChange(e.target.value)}
				value={field.state.value}
			/>
			{description && <FieldDescription>{description}</FieldDescription>}
			<FieldError match={!field.state.meta.isValid}>{field.state.meta.errors[0]}</FieldError>
		</Field>
	);
}

export const { useAppForm, withForm } = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: {
		TextField,
		TextareaField,
	},
	formComponents: {},
});
