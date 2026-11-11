import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../../config/env";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include",
});

let refreshPromise = null;

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  const isAuthRoute = args?.url === "/auth/refresh" || args?.url === "/auth/login";

  if (result.error?.status === 401 && !isAuthRoute) {
    refreshPromise =
      refreshPromise || rawBaseQuery({ url: "/auth/refresh", method: "POST" }, api, extraOptions);

    const refreshResult = await refreshPromise;
    refreshPromise = null;

    if (refreshResult.error) return result;

    result = await rawBaseQuery(args, api, extraOptions);
  }

  return result;
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["User"],
  endpoints: (builder) => ({
    getAuthProviders: builder.query({
      query: () => "/auth/providers",
      transformResponse: (res) => res.providers || {},
    }),
    getCurrentUser: builder.query({
      query: () => "/auth/me",
      providesTags: ["User"],
    }),
    loginUser: builder.mutation({
      query: (data) => ({ url: "/auth/login", method: "POST", body: data }),
      invalidatesTags: ["User"],
    }),
    registerUser: builder.mutation({
      query: (data) => ({ url: "/auth/register", method: "POST", body: data }),
      invalidatesTags: ["User"],
    }),
    logoutUser: builder.mutation({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      invalidatesTags: ["User"],
    }),
    forgotPassword: builder.mutation({
      query: (data) => ({ url: "/auth/password/forgot", method: "POST", body: data }),
    }),
    verifyResetOTP: builder.mutation({
      query: (data) => ({ url: "/auth/password/verify-otp", method: "POST", body: data }),
    }),
    resetPassword: builder.mutation({
      query: (data) => ({ url: "/auth/password/reset", method: "POST", body: data }),
    }),
  }),
});

export const {
  useGetAuthProvidersQuery,
  useGetCurrentUserQuery,
  useLoginUserMutation,
  useRegisterUserMutation,
  useLogoutUserMutation,
  useForgotPasswordMutation,
  useVerifyResetOTPMutation,
  useResetPasswordMutation,
} = authApi;
