import { useEffect, useState } from "react";
import axios from "axios";
import { Search, SearchX, TriangleAlert, X } from "lucide-react";
import { searchUsers } from "../../api/authApi";
import { useChat } from "../../context/chatContext";
import useDebounce from "../../hooks/useDebounce";
import Avatar from "../common/Avatar";
import EmptyState from "../common/EmptyState";
import { Skeleton, Spinner } from "../common/Loader";
import ConversationItem from "./ConversationItem";

// Debounced search against GET /auth/search. Stale requests are aborted.
function useUserSearch(query) {
    const debounced = useDebounce(query, 300);
    const term = debounced.trim();
    const [state, setState] = useState({ term: "", results: [], failed: false });

    useEffect(() => {
        if (!term) return;

        const controller = new AbortController();

        searchUsers(term, controller.signal)
            .then((results) => setState({ term, results, failed: false }))
            .catch((error) => {
                if (axios.isCancel(error)) return;
                setState({ term, results: [], failed: true });
            });

        return () => controller.abort();
    }, [term]);

    const settled = state.term === term;

    return {
        loading: query.trim() !== "" && (!settled || query.trim() !== term),
        results: settled ? state.results : [],
        failed: settled && state.failed
    };
}

function PersonRow({ person, onPick, busy, online }) {
    return (
        <button
            type="button"
            className="person"
            onClick={() => onPick(person)}
            disabled={busy}
        >
            <Avatar user={person} size="lg" online={online} />
            <span className="person__body">
                <span className="person__name">{person.name}</span>
                <span className="person__email">{person.email}</span>
            </span>
            {busy && <Spinner size={16} />}
        </button>
    );
}

/**
 * Search box + results. While the box is empty it renders `children`
 * (the normal conversation list).
 */
export default function UserSearch({ query, onQueryChange, inputRef, children }) {
    const { conversations, getOtherUser, isOnline, startConversation, activeId, openConversation } = useChat();
    const { loading, results, failed } = useUserSearch(query);
    const [busyId, setBusyId] = useState(null);

    const term = query.trim().toLowerCase();

    const matchingConversations = term
        ? conversations.filter((conversation) => {
              const other = getOtherUser(conversation);
              return (
                  other?.name?.toLowerCase().includes(term) ||
                  other?.email?.toLowerCase().includes(term)
              );
          })
        : [];

    const existingIds = new Set(
        matchingConversations.map((conversation) => getOtherUser(conversation)?._id)
    );

    const people = results.filter((person) => !existingIds.has(person._id));

    const pickPerson = async (person) => {
        setBusyId(person._id);
        const conversation = await startConversation(person);
        setBusyId(null);

        if (conversation) onQueryChange("");
    };

    const selectConversation = (id) => {
        openConversation(id);
        onQueryChange("");
    };

    return (
        <>
            <div className="search">
                <Search size={17} className="search__icon" aria-hidden="true" />
                <input
                    ref={inputRef}
                    type="search"
                    className="search__input"
                    placeholder="Search people or chats"
                    value={query}
                    onChange={(event) => onQueryChange(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Escape") onQueryChange("");
                    }}
                    aria-label="Search people or conversations"
                    autoComplete="off"
                    spellCheck={false}
                />
                {query && (
                    <button
                        type="button"
                        className="search__clear"
                        onClick={() => {
                            onQueryChange("");
                            inputRef.current?.focus();
                        }}
                        aria-label="Clear search"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {!term ? (
                children
            ) : (
                <div className="search-results">
                    {matchingConversations.length > 0 && (
                        <section>
                            <h3 className="section-label">Conversations</h3>
                            {matchingConversations.map((conversation) => (
                                <ConversationItem
                                    key={conversation._id}
                                    conversation={conversation}
                                    active={conversation._id === activeId}
                                    onSelect={selectConversation}
                                />
                            ))}
                        </section>
                    )}

                    <section>
                        <h3 className="section-label">People</h3>

                        {loading && people.length === 0 && (
                            <div aria-busy="true">
                                {[0, 1, 2].map((index) => (
                                    <div key={index} className="conv-skeleton">
                                        <Skeleton width={48} height={48} radius={999} />
                                        <div className="conv-skeleton__lines">
                                            <Skeleton width="50%" height={13} />
                                            <Skeleton width="75%" height={11} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!loading && failed && (
                            <EmptyState
                                compact
                                tone="danger"
                                icon={TriangleAlert}
                                title="Search failed"
                                description="We couldn't reach the server. Try again in a moment."
                            />
                        )}

                        {people.map((person) => (
                            <PersonRow
                                key={person._id}
                                person={person}
                                online={isOnline(person)}
                                busy={busyId === person._id}
                                onPick={pickPerson}
                            />
                        ))}

                        {!loading &&
                            !failed &&
                            people.length === 0 &&
                            matchingConversations.length === 0 && (
                                <EmptyState
                                    compact
                                    icon={SearchX}
                                    title="No results"
                                    description={`No one matches "${query.trim()}". Try a different name or email.`}
                                />
                            )}
                    </section>
                </div>
            )}
        </>
    );
}
