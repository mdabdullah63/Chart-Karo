import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../../config/env";

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include",
});

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery,
  tagTypes: ["Contacts", "Conversations", "Messages", "Groups"],
  endpoints: (builder) => ({
    getContacts: builder.query({
      query: () => "/api/contacts",
      transformResponse: (res) =>
        (res.contacts || [])
          .filter((c) => c.contact)
          .map((c) => ({
            ...c.contact,
            contactRelationId: c._id,
            addedAt: c.createdAt,
          })),
      providesTags: ["Contacts"],
    }),

    addContact: builder.mutation({
      query: (email) => ({ url: "/api/contacts", method: "POST", body: { email } }),
      invalidatesTags: ["Contacts"],
    }),

    removeContact: builder.mutation({
      query: (contactUserId) => ({
        url: `/api/contacts/${contactUserId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Contacts"],
    }),

    getConversations: builder.query({
      query: () => "/api/conversations",
      transformResponse: (res) => res.conversations,
      providesTags: ["Conversations"],
    }),

    createConversation: builder.mutation({
      query: (otherUserId) => ({
        url: "/api/conversations",
        method: "POST",
        body: { otherUserId },
      }),
      transformResponse: (res) => res.conversation,
      invalidatesTags: ["Conversations"],
    }),

    getMessages: builder.query({
      query: (conversationId) => `/api/messages/${conversationId}`,
      transformResponse: (res) => res.messages,
      providesTags: (result, error, conversationId) => [
        { type: "Messages", id: conversationId },
      ],
    }),
    getMyGroups: builder.query({
      query: () => "/api/groups",
      transformResponse: (res) => res.groups,
      providesTags: ["Groups"],
    }),

    getGroupById: builder.query({
      query: (groupId) => `/api/groups/${groupId}`,
      transformResponse: (res) => res.group,
      providesTags: (result, error, groupId) => [{ type: "Groups", id: groupId }],
    }),

    createGroup: builder.mutation({
      query: ({ name, description, avatar, members }) => ({
        url: "/api/groups",
        method: "POST",
        body: { name, description, avatar, members },
      }),
      invalidatesTags: ["Groups", "Conversations"],
    }),

    updateGroup: builder.mutation({
      query: ({ groupId, ...data }) => ({
        url: `/api/groups/${groupId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Groups", "Conversations"],
    }),

    deleteGroup: builder.mutation({
      query: (groupId) => ({
        url: `/api/groups/${groupId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Groups", "Conversations"],
    }),

    addGroupMembers: builder.mutation({
      query: ({ groupId, memberIds }) => ({
        url: `/api/groups/${groupId}/members`,
        method: "POST",
        body: { memberIds },
      }),
      invalidatesTags: ["Groups", "Conversations"],
    }),

    removeGroupMember: builder.mutation({
      query: ({ groupId, memberId }) => ({
        url: `/api/groups/${groupId}/members`,
        method: "DELETE",
        body: { memberId },
      }),
      invalidatesTags: ["Groups", "Conversations"],
    }),
  }),
});

export const {
  useGetContactsQuery,
  useAddContactMutation,
  useRemoveContactMutation,
  useGetConversationsQuery,
  useCreateConversationMutation,
  useGetMessagesQuery,
  useGetMyGroupsQuery,
  useGetGroupByIdQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useAddGroupMembersMutation,
  useRemoveGroupMemberMutation,
} = chatApi;
