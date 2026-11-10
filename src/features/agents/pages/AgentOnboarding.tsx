import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  ArrowLeft,
  Users,
  User,
  Phone,
  Mail,
  CalendarDays,
  MapPin,
  Plus,
} from "lucide-react";
import { useAuth } from "../../../components/context/AuthContext";
import { toast } from "../../../lib/toast";
import type { AgentDetail, AgentEditableFields } from "../types";

const genderOptions = ["FEMALE", "MALE", "OTHER"];

interface AgentFormValues {
  firstName: string;
  middleName: string;
  lastName: string;
  phone: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  region: string;
  district: string;
}

interface AgentRegistrationErrorResponse {
  message: string;
  // keyed by the API's own field names (e.g. "regionId"/"districtId"), which
  // don't all match AgentFormValues' keys — remapped before setErrors().
  errors: Record<string, string> | null;
}

// The /locations endpoints key regions and districts by an `id` code (e.g.
// "TZ02"), not their display `name` — districts even self-reference their
// parent region by that same id (`regionId`), so the whole location model is
// id-keyed. formik.values.region/district hold the id; `name` is for display.
interface LocationOption {
  id: string;
  name: string;
}

const getInputClass = (hasError: boolean) =>
  `w-full rounded-xl border bg-surface py-2.5 pl-10 pr-3.5 text-sm outline-none ring-1 transition-colors focus:border-brand ${
    hasError ? "border-red-400 ring-red-300" : "border-transparent ring-line"
  }`;
const getPlainInputClass = (hasError: boolean) =>
  `w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 transition-colors focus:border-brand ${
    hasError ? "border-red-400 ring-red-300" : "border-transparent ring-line"
  }`;
const errorClass = "mt-1 text-xs font-medium text-red-600";

const splitName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0)
    return { firstName: "", middleName: "", lastName: "" };
  if (parts.length === 1)
    return { firstName: parts[0], middleName: "", lastName: "" };
  if (parts.length === 2)
    return { firstName: parts[0], middleName: "", lastName: parts[1] };
  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
};

interface AgentOnboardingProps {
  mode: "create" | "edit";
  initialAgent?: AgentDetail;
  onCancel: () => void;
  onSubmit: (values: AgentEditableFields) => void;
}

export default function AgentOnboarding({
  mode,
  initialAgent,
  onCancel,
  onSubmit,
}: AgentOnboardingProps) {
  const { user } = useAuth();

  const initialNameParts = splitName(initialAgent?.fullName ?? "");

  const [regions, setRegions] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const agentSchema = Yup.object({
    firstName: Yup.string().trim().required("First name is required"),
    middleName: Yup.string().trim().required("Middle name is required"),
    lastName: Yup.string().trim().required("Last name is required"),
    phone: Yup.string()
      .matches(/^\+?[0-9\s-]{7,15}$/, "Enter a valid phone number")
      .required("Phone number is required"),
    email: Yup.string().email("Enter a valid email"),
    dateOfBirth: Yup.string().required("Date of birth is required"),
    region: Yup.string().required("Region is required"),
    district: Yup.string().required("District is required"),
  });

  const formik = useFormik<AgentFormValues>({
    initialValues: {
      firstName: initialNameParts.firstName,
      middleName: initialNameParts.middleName,
      lastName: initialNameParts.lastName,
      phone: initialAgent?.phone ?? "",
      email: initialAgent?.email ?? "",
      gender: initialAgent?.gender ?? "FEMALE",
      dateOfBirth: initialAgent?.dateOfBirth ?? "",
      region: initialAgent?.regionId ?? "",
      district: initialAgent?.districtId ?? "",
    },
    validationSchema: agentSchema,
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      const payload: Record<string, string> = {
        firstName: values.firstName.trim(),
        middleName: values.middleName.trim(),
        lastName: values.lastName.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        gender: values.gender,
        dateOfBirth: values.dateOfBirth,
        regionId: values.region,
        districtId: values.district,
      };

      const url =
        mode === "create"
          ? `${import.meta.env.VITE_API_BASE_URL}/agents/onboard`
          : `${import.meta.env.VITE_API_BASE_URL}/agents/${initialAgent?.agentId}`;

      let response: Response;
      try {
        response = await fetch(url, {
          method: mode === "create" ? "POST" : "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.accessToken ?? ""}`,
          },
          body: JSON.stringify(payload),
        });
      } catch {
        toast.error("Network Error", {
          description:
            "Could not reach the server. Check your connection and try again.",
          duration: 3000,
        });
        setSubmitting(false);
        return;
      }

      if (!response.ok) {
        let body: AgentRegistrationErrorResponse | null = null;
        try {
          body = await response.json();
        } catch {
          // no JSON body to parse
        }
        if (body?.errors) {
          const { regionId, districtId, ...rest } = body.errors;
          setErrors({
            ...rest,
            ...(regionId ? { region: regionId } : {}),
            ...(districtId ? { district: districtId } : {}),
          });
        } else if (mode === "create" && response.status === 409) {
          toast.error("Agent Creation Failed", {
            description: "An agent already exists.",
            duration: 3000,
          });
        } else {
          toast.error(
            mode === "create" ? "Agent Creation Failed" : "Agent Update Failed",
            {
              description:
                mode === "create"
                  ? "Could not create the agent. Check the details and try again."
                  : "Could not update the agent. Check the details and try again.",
              duration: 3000,
            },
          );
        }
        setSubmitting(false);
        return;
      }

      const fullName = [values.firstName, values.middleName, values.lastName]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(" ");
      // values.region/district hold location ids ("TZ02") — resolve back to
      // display names for the human-readable result.
      const regionName =
        regions.find((r) => r.id === values.region)?.name ?? values.region;
      const districtName =
        districts.find((d) => d.id === values.district)?.name ??
        values.district;
      const result: AgentEditableFields = {
        agentId: initialAgent?.agentId ?? "",
        fullName,
        phone: values.phone.trim(),
        email: values.email.trim(),
        dateOfBirth: values.dateOfBirth,
        region: regionName,
        district: districtName,
      };
      setSubmitting(false);
      onSubmit(result);
    },
  });

  const hasError = (field: keyof typeof formik.values) =>
    Boolean(formik.touched[field] && formik.errors[field]);

  useEffect(() => {
    let active = true;
    const loadRegions = async () => {
      setLoadingRegions(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/locations/regions`,
          {
            headers: { Authorization: `Bearer ${user?.accessToken ?? ""}` },
          },
        );
        if (!response.ok) throw new Error("Failed to load regions");
        const body: { data: LocationOption[] } = await response.json();
        if (active) setRegions(body.data ?? []);
      } catch {
        if (active) {
          toast.error("Could Not Load Regions", {
            description:
              "Failed to fetch the list of regions. Please try again.",
            duration: 3000,
          });
        }
      } finally {
        if (active) setLoadingRegions(false);
      }
    };
    loadRegions();
    return () => {
      active = false;
    };
  }, [user?.accessToken]);

  useEffect(() => {
    if (regions.length === 0) return;
    if (!formik.values.region) {
      formik.setFieldValue("region", regions[0].id);
      return;
    }
    // Edit mode seeds this from the agent's existing `region` value, which
    // may be a display name rather than an id — resolve it once the real
    // region list is in.
    const matchesId = regions.some((r) => r.id === formik.values.region);
    if (!matchesId) {
      const matchByName = regions.find((r) => r.name === formik.values.region);
      if (matchByName) formik.setFieldValue("region", matchByName.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regions]);

  useEffect(() => {
    const region = formik.values.region;
    if (!region) {
      return;
    }
    let active = true;
    const loadDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/locations/districts?regionId=${encodeURIComponent(region)}`,
          {
            headers: {
              Authorization: `Bearer ${user?.accessToken ?? ""}`,
            },
          },
        );

        if (!response.ok) throw new Error("Failed to load districts");

        const body: { data: LocationOption[] } = await response.json();
        if (active) setDistricts(body.data ?? []);
      } catch {
        if (active) {
          setDistricts([]);
          toast.error("Could Not Load Districts", {
            description:
              "Failed to fetch districts for the selected region. Please try again.",
            duration: 3000,
          });
        }
      } finally {
        if (active) setLoadingDistricts(false);
      }
    };
    loadDistricts();
    return () => {
      active = false;
    };
  }, [formik.values.region, user?.accessToken]);

  useEffect(() => {
    if (districts.length === 0) return;
    const matchesId = districts.some((d) => d.id === formik.values.district);
    if (matchesId) return;
    // Same id/name resolution as regions, for edit mode's existing district value.
    const matchByName = districts.find((d) => d.name === formik.values.district);
    formik.setFieldValue("district", matchByName ? matchByName.id : districts[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districts]);

  const handleRegionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const region = event.target.value;
    formik.setFieldValue("region", region);
    if (!region) {
      setDistricts([]);
      formik.setFieldValue("district", "");
    }
  };

  return (
    <form className="space-y-5" onSubmit={formik.handleSubmit}>
      <button
        type="button"
        onClick={onCancel}
        className="group inline-flex items-center gap-1.5 overflow-hidden rounded-full px-3 py-1.5 text-sm font-semibold text-brand transition-colors duration-300 ease-out hover:bg-brand hover:text-white"
      >
        <ArrowLeft
          size={14}
          className="transition-transform duration-300 ease-out group-hover:-translate-x-1"
        />
        Back
      </button>

      <div className="bg-white p-6 ring-1 ring-line">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Users size={20} />
          </span>
          <div>
            <h1 className="text-xl font-extrabold text-ink">
              {mode === "create" ? "Agent Onboarding" : "Edit Agent"}
            </h1>
            <p className="text-sm text-muted">
              {mode === "create"
                ? "Register a new agent to enable them to perform transactions."
                : "Update this agent's details."}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-muted">
              First Name <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <User
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="text"
                name="firstName"
                value={formik.values.firstName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. Mary"
                className={getInputClass(hasError("firstName"))}
              />
            </div>
            {hasError("firstName") && (
              <p className={errorClass}>{formik.errors.firstName}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted">
              Middle Name <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <User
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="text"
                name="middleName"
                value={formik.values.middleName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. Wanjiru"
                className={getInputClass(hasError("middleName"))}
              />
            </div>
            {hasError("middleName") && (
              <p className={errorClass}>{formik.errors.middleName}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted">
              Last Name <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <User
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="text"
                name="lastName"
                value={formik.values.lastName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. James"
                className={getInputClass(hasError("lastName"))}
              />
            </div>
            {hasError("lastName") && (
              <p className={errorClass}>{formik.errors.lastName}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <Phone
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="text"
                name="phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. 0712 345 678"
                className={getInputClass(hasError("phone"))}
              />
            </div>
            {hasError("phone") && (
              <p className={errorClass}>{formik.errors.phone}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted">
              Email Address
            </label>
            <div className="relative mt-1">
              <Mail
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="email"
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. mary.james@walletpesa.co.tz"
                className={getInputClass(hasError("email"))}
              />
            </div>
            {hasError("email") && (
              <p className={errorClass}>{formik.errors.email}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Gender</label>
            <select
              name="gender"
              value={formik.values.gender}
              onChange={formik.handleChange}
              className={`mt-1 ${getPlainInputClass(false)}`}
            >
              {genderOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <CalendarDays
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="date"
                name="dateOfBirth"
                value={formik.values.dateOfBirth}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={getInputClass(hasError("dateOfBirth"))}
              />
            </div>
            {hasError("dateOfBirth") && (
              <p className={errorClass}>{formik.errors.dateOfBirth}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted">
              Region <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <MapPin
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <select
                name="region"
                value={formik.values.region}
                onChange={handleRegionChange}
                disabled={loadingRegions}
                className={getInputClass(false)}
              >
                {loadingRegions && <option value="">Loading regions...</option>}
                {!loadingRegions && regions.length === 0 && (
                  <option value="">No regions available</option>
                )}
                {regions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">
              District <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <MapPin
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <select
                name="district"
                value={formik.values.district}
                onChange={formik.handleChange}
                disabled={loadingDistricts}
                className={getInputClass(false)}
              >
                {loadingDistricts && (
                  <option value="">Loading districts...</option>
                )}
                {!loadingDistricts && districts.length === 0 && (
                  <option value="">No districts available</option>
                )}
                {districts.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-red-600 hover:text-red-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={formik.isSubmitting}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus size={16} />
          {formik.isSubmitting
            ? "Creating..."
            : mode === "create"
              ? "Create Agent"
              : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
