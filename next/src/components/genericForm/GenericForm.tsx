"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import type { ComponentType, FC, ReactNode } from "react";
import { useEffect, useState } from "react";
import {
	type DefaultValues,
	type FieldValues,
	type Path,
	type PathValue,
	type UseFormReturn,
	FormProvider as Form,
	useForm,
} from "react-hook-form";
import type { ZodType } from "zod";
import { Button } from "@/components/ui/button";
import {
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import { handleApiError, notify } from "@/errors";
import {
	type FieldWrapperProps,
	type FormField,
	type FormSection,
	GenericInput,
	type SectionWrapperProps,
} from "./GenericInput";

// =====================================================================
// INTERNAL DEFAULT WRAPPERS
// =====================================================================

// 1. Ghost (Invisible): For simple/flat forms
const GhostWrapper: FC<SectionWrapperProps> = ({
	children,
	title,
	className,
}) => (
	<div className={`w-full ${className || ""}`}>
		{title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
		{children}
	</div>
);

// 2. Card (Standard): Design with border and shadow
const CardWrapper: FC<SectionWrapperProps> = ({
	children,
	title,
	description,
	icon: Icon,
	className,
}) => (
	<div
		className={`border rounded-xl p-3 md:p-4 bg-card shadow-sm ${className || ""}`}
	>
		<div className="flex flex-col gap-0.5 mb-3 pb-2 border-b">
			<div className="flex items-center gap-2">
				{Icon && (
					<div className="p-1 bg-primary/10 rounded-md text-primary">
						<Icon className="w-3.5 h-3.5" />
					</div>
				)}
				<h3 className="font-semibold text-sm md:text-base tracking-tight">
					{title}
				</h3>
			</div>
			{description && (
				<p className="text-[10px] md:text-xs text-muted-foreground ml-0.5">
					{description}
				</p>
			)}
		</div>
		{children}
	</div>
);

// =====================================================================
// MAIN COMPONENT
// =====================================================================

type CustomFieldRenderer<T extends FieldValues> = (
	methods: UseFormReturn<T>,
) => ReactNode;

export interface GenericFormProps<T extends FieldValues> {
	// A. DATA (Automatic Mode)
	formSections?: FormSection[]; // Complex structure
	fields?: FormField[]; // Simple structure (flat)

	// B. LOGICAL CONTROL
	schema: ZodType<T, any, any>;
	onSubmit: (data: T) => any | Promise<any>;
	initialData?: DefaultValues<T>;

	// C. UI CUSTOMIZATION (Hybrid Mode)
	title?: string;
	description?: string;
	submitButtonText?: string;
	cancelButtonText?: string;
	onCancel?: () => void;
	isLoading?: boolean;
	isDisabled?: boolean;
	activateSubmitButton?: boolean;
	formMethods?: UseFormReturn<T>;

	// UI Injections (Wrappers and Custom Footer)
	globalSectionWrapper?: ComponentType<SectionWrapperProps>; // Change all Cards
	globalFieldWrapper?: ComponentType<FieldWrapperProps>; // Change all Inputs
	renderFooter?: (props: {
		// Change buttons
		isSubmitting: boolean;
		onCancel?: () => void;
		onSubmit: () => void;
		methods: UseFormReturn<T>;
	}) => ReactNode;

	formClassName?: string; // Classes for the <form> tag

	// D. TOTAL CONTROL (Manual Mode)
	// If you use this, you draw ALL the HTML inside (inputs, layouts, and buttons).
	children?: (props: {
		methods: UseFormReturn<T>;
		isSubmitting: boolean;
		onSubmit: () => void;
		submissionMessage: { type: "success" | "error"; message: string } | null;
	}) => ReactNode;

	// E. EXTRAS
	onFieldChange?: (fieldName: string, value: any) => void;
	customFields?: Record<string, CustomFieldRenderer<T>>;
	showErrorsAsToasts?: boolean;
}

export const GenericForm = <T extends FieldValues>({
	formSections,
	fields,
	schema,
	onSubmit,
	title,
	description,
	initialData,
	submitButtonText = "Submit",
	cancelButtonText = "Cancel",
	onCancel,
	onFieldChange,
	customFields = {},
	isLoading = false,
	isDisabled = false,
	activateSubmitButton = true,
	formMethods,

	// Custom injections
	globalSectionWrapper,
	globalFieldWrapper,
	renderFooter,
	formClassName,
	children, // Render prop for manual mode
	showErrorsAsToasts = false,
}: GenericFormProps<T>) => {
	// 1. NORMALIZATION (Only matters if NOT using 'children')
	let normalizedSections: FormSection[] = [];
	let allFieldsFlat: FormField[] = [];

	if (formSections && formSections.length > 0) {
		normalizedSections = formSections;
		allFieldsFlat = formSections.flatMap((s) => s.fields);
	} else if (fields && fields.length > 0) {
		normalizedSections = [{ title: "", fields: fields, wrapper: GhostWrapper }];
		allFieldsFlat = fields;
	}

	// 2. REACT HOOK FORM SETUP
	const defaults = { ...initialData } as DefaultValues<T>;
	// Populate defaults from field config if not already in initialData
	for (const field of allFieldsFlat) {
		const name = field.name as Path<T>;
		if (!(name in defaults) && field.defaultValue !== undefined) {
			defaults[name] = (
				field.type === "radio" || field.type === "select"
					? String(field.defaultValue)
					: field.defaultValue
			) as PathValue<T, Path<T>>;
		}
	}

	const internalMethods = useForm<T>({
		resolver: zodResolver(schema),
		defaultValues: defaults,
		values: initialData as any, // Reinitializes form when async initialData arrives
	});

	const methods = (formMethods as UseFormReturn<T>) || (internalMethods as UseFormReturn<T>);

	const {
		register,
		handleSubmit,
		watch,
		control,
		formState: { errors, isSubmitting },
	} = methods;

	const [submissionMessage, setSubmissionMessage] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	useEffect(() => {
		if (onFieldChange) {
			const subscription = watch((value, { name }) => {
				if (name) onFieldChange(name, value[name as string]);
			});
			return () => subscription.unsubscribe();
		}
	}, [watch, onFieldChange]);

	const formValues = watch();

	const isHidden = (field: FormField) => {
		if (typeof field.hidden === "function") {
			return field.hidden(formValues);
		}
		return !!field.hidden;
	};

	// 3. SUBMIT HANDLER
	const handleFormSubmit = async (data: FieldValues) => {
		setSubmissionMessage(null);
		const processedData: any = {};

		// Type processing (Number, Boolean) before sending
		for (const key in data) {
			// Look for field config (if existing in automatic mode)
			const fieldConfig = allFieldsFlat.find((f) => f.name === key);

			if (!fieldConfig) {
				processedData[key] = data[key];
				continue;
			}

			if (fieldConfig.type === "custom") {
				processedData[key] = data[key];
				continue;
			}

			if (fieldConfig.type === "number") {
				processedData[key] =
					data[key] === null || data[key] === ""
						? undefined
						: Number(data[key]);
			} else if (fieldConfig.type === "checkbox") {
				processedData[key] = Boolean(data[key]);
			} else if (
				fieldConfig.type === "radio" ||
				fieldConfig.type === "select"
			) {
				const optionValue = fieldConfig.options?.find(
					(opt) => String(opt.value) === String(data[key]),
				)?.value;
				processedData[key] = optionValue ?? data[key];
			} else {
				processedData[key] = data[key];
			}
		}

		try {
			await onSubmit(processedData as T);
			setSubmissionMessage({
				type: "success",
				message: "Operation successful!",
			});
		} catch (e: any) {
			const errorRes = handleApiError(e);
			setSubmissionMessage({ type: "error", message: errorRes.message });

			// If error contains field failures, apply them to the form
			if (errorRes.fieldErrors) {
				Object.entries(errorRes.fieldErrors).forEach(([field, message]) => {
					methods.setError(field as any, {
						type: "server",
						message: message as string,
					});
				});
			}
			throw e;
		}
	};

	const isLocked = isSubmitting || isLoading || isDisabled;
	const onSubmitFn = handleSubmit(handleFormSubmit, (errs) => {
		console.warn("🔥 Zod validation error:", errs);

		// Recursive function to extract all error messages from a nested object
		const showAllErrors = (obj: any) => {
			if (!obj) return;
			if (obj.message && typeof obj.message === "string") {
				notify.error(obj.message);
				return;
			}
			Object.values(obj).forEach((val) => showAllErrors(val));
		};

		if (showErrorsAsToasts) {
			showAllErrors(errs);
		}
	});

	// A. MANUAL MODE (TOTAL USER CONTROL)
	if (children) {
		return (
			<Form {...methods}>
				<form onSubmit={onSubmitFn} className={formClassName}>
					{children({
						methods,
						isSubmitting: isLocked,
						onSubmit: onSubmitFn,
						submissionMessage,
					})}
				</form>
			</Form>
		);
	}

	// B. AUTOMATIC / HYBRID MODE (SECTIONS AND CARDS)
	const DefaultFooter = (
		<div className="flex justify-end gap-3 mt-4">
			{onCancel && (
				<Button
					type="button"
					variant="outline"
					onClick={onCancel}
					disabled={isLocked}
				>
					{cancelButtonText}
				</Button>
			)}
			{activateSubmitButton && (
				<Button type="submit" disabled={isLocked}>
					{isLocked && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					{submitButtonText}
				</Button>
			)}
		</div>
	);

	return (
		<div className="w-full mx-auto border-0 shadow-none py-0 bg-none opacity-100">
			{(title || description) && (
				<CardHeader className="px-0 pb-6">
					{title && <CardTitle className="text-2xl">{title}</CardTitle>}
					{description && <CardDescription>{description}</CardDescription>}
				</CardHeader>
			)}
			<CardContent className="px-0 gap-2">
				<Form {...methods}>
					<form
						onSubmit={onSubmitFn}
						className={`space-y-4 ${formClassName || ""}`}
					>
						<fieldset disabled={isLocked} className="space-y-4">
							{normalizedSections.map((section, idx) => {
								// Wrapper Priority: Global -> Section -> Default (Card/Ghost)
								const Container =
									globalSectionWrapper ||
									section.wrapper ||
									(formSections ? CardWrapper : GhostWrapper);

								// Verify if all fields in the section are hidden
								const areAllFieldsHidden = section.fields.every((f) =>
									isHidden(f),
								);
								if (areAllFieldsHidden) return null;

								return (
									<Container
										key={`section-${idx}`}
										title={section.title}
										description={section.description}
										icon={section.icon}
										className={section.className}
									>
										<div className=" grid grid-cols-1 md:grid-cols-12 gap-x-4">
											{section.fields.map((field) => {
												const fieldIsHidden = isHidden(field);

												// Custom Fields
												if (customFields[field.name]) {
													if (fieldIsHidden) return null; // Respect hidden property
													return (
														<div
															key={field.name}
															className={`w-full ${field.containerClassName || "col-span-12"}`}
														>
															{customFields[field.name](methods)}
														</div>
													);
												}

												if (fieldIsHidden) return null;
												// Generic Inputs
												return (
													<GenericInput
														key={field.name}
														field={field}
														register={register as any}
														control={control as any}
														errors={errors}
														FieldWrapper={globalFieldWrapper}
													/>
												);
											})}
										</div>
									</Container>
								);
							})}
						</fieldset>

						{/* Dynamic Footer: Either custom or default */}
						{renderFooter
							? renderFooter({
								isSubmitting: isLocked,
								onCancel,
								onSubmit: onSubmitFn,
								methods,
							})
							: DefaultFooter}
					</form>
				</Form>
			</CardContent>
		</div>
	);
};
