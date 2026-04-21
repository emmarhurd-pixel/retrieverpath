import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { UMBC_COURSES } from '../data/courses';
import type { StudyGroup, StudyMessage } from '../types';
import {
  MessageSquare,
  Users,
  Search,
  Send,
  UserPlus,
  X,
  ArrowLeft,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Collapsible } from '../components/Collapsible';

const DEPT_GROUPS: Record<string, string[]> = {};
UMBC_COURSES.forEach((c) => {
  if (!DEPT_GROUPS[c.department]) DEPT_GROUPS[c.department] = [];
  DEPT_GROUPS[c.department].push(c.code);
});
const SORTED_DEPTS = Object.keys(DEPT_GROUPS).sort();

function ChatView({
  group,
  userId,
  userName,
  onPost,
  onBack,
}: {
  group: StudyGroup;
  userId: string;
  userName: string;
  onPost: (msg: StudyMessage) => void;
  onBack: () => void;
}) {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [group.messages]);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onPost({
      id: uuidv4(),
      userId,
      userName: userName || 'You',
      content: trimmed,
      timestamp: new Date().toISOString(),
    });
    setText('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b border-umbc-gray-light bg-umbc-gray">
        <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="font-bold text-white">{group.courseCode}</div>
          <div className="text-gray-400 text-xs">
            {group.courseName} · {group.members.length} member{group.members.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {group.messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8 text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          group.messages.map((msg) => {
            const isMe = msg.userId === userId;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs rounded-2xl px-4 py-2 ${
                    isMe
                      ? 'bg-umbc-gold text-black rounded-br-sm'
                      : 'bg-umbc-gray-mid text-white rounded-bl-sm'
                  }`}
                >
                  {!isMe && (
                    <div className="text-xs font-semibold text-umbc-gold mb-0.5">
                      {msg.userName}
                    </div>
                  )}
                  <p className="text-sm">{msg.content}</p>
                  <div className={`text-xs mt-1 ${isMe ? 'text-black/60' : 'text-gray-500'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-umbc-gray-light bg-umbc-gray">
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask a question or share a resource..."
            className="input-field text-sm py-2 flex-1"
          />
          <button
            onClick={send}
            disabled={!text.trim()}
            className="bg-umbc-gold text-black rounded-lg px-3 py-2 hover:bg-umbc-gold-dark transition-colors disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function StudyNetwork() {
  const { studyGroups, joinStudyGroup, postMessage, friends, addFriend, removeFriend, profile, userId, courses } = useStore();

  const [tab, setTab] = useState<'groups' | 'friends'>('groups');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState<StudyGroup | null>(null);
  const [friendInput, setFriendInput] = useState('');

  const myId = userId || 'local-user';
  const myName = profile?.name || 'You';

  const myGroups = studyGroups.filter((g) => g.members.includes(myId));

  const handleJoin = (courseCode: string) => {
    const info = UMBC_COURSES.find((c) => c.code === courseCode);
    if (!info) return;
    const existing = studyGroups.find((g) => g.courseCode === courseCode);
    if (existing) {
      if (!existing.members.includes(myId)) {
        joinStudyGroup({ ...existing, members: [...existing.members, myId] });
      }
      setActiveGroup(existing);
      return;
    }
    const newGroup: StudyGroup = {
      id: uuidv4(),
      courseCode,
      courseName: info.name,
      department: info.department,
      members: [myId],
      messages: [],
    };
    joinStudyGroup(newGroup);
    setActiveGroup(newGroup);
  };

  const handlePost = (msg: StudyMessage) => {
    if (!activeGroup) return;
    postMessage(activeGroup.id, msg);
    setActiveGroup((g) => g ? { ...g, messages: [...g.messages, msg] } : null);
  };

  const handleAddFriend = () => {
    const trimmed = friendInput.trim();
    if (!trimmed) return;
    addFriend({
      id: uuidv4(),
      name: trimmed,
      email: trimmed.includes('@') ? trimmed : `${trimmed}@umbc.edu`,
    });
    setFriendInput('');
  };

  const myCourseCodes = courses.map((c) => c.courseCode.toUpperCase());

  const filteredCourses = UMBC_COURSES.filter((c) => {
    if (!searchQuery) return false;
    return (
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }).slice(0, 12);

  if (activeGroup) {
    return (
      <div className="min-h-screen bg-black pb-24 flex flex-col max-h-screen">
        <div className="flex-1 flex flex-col min-h-0">
          <ChatView
            group={activeGroup}
            userId={myId}
            userName={myName}
            onPost={handlePost}
            onBack={() => setActiveGroup(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-4">
        <h1 className="text-2xl font-bold text-white">Study Network</h1>

        <div className="flex gap-1 bg-umbc-gray rounded-xl p-1">
          {(['groups', 'friends'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${
                tab === t
                  ? 'bg-umbc-gold text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t === 'groups' ? (
                <span className="flex items-center justify-center gap-1.5">
                  <MessageSquare size={14} /> Study Groups
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <Users size={14} /> Friends
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'groups' && (
          <div className="space-y-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any UMBC course..."
                className="input-field pl-9 text-sm"
              />
            </div>

            {searchQuery && filteredCourses.length > 0 && (
              <div className="bg-umbc-gray border border-umbc-gray-light rounded-xl overflow-hidden">
                {filteredCourses.map((c) => {
                  const joined = studyGroups.some(
                    (g) => g.courseCode === c.code && g.members.includes(myId)
                  );
                  return (
                    <div
                      key={c.code}
                      className="flex items-center justify-between px-4 py-3 border-b border-umbc-gray-light last:border-0"
                    >
                      <div>
                        <span className="font-mono text-xs text-umbc-gold font-semibold">
                          {c.code}
                        </span>
                        <span className="text-white text-sm ml-2">{c.name}</span>
                      </div>
                      <button
                        onClick={() => handleJoin(c.code)}
                        className={`text-xs px-3 py-1 rounded-lg font-semibold transition-colors ${
                          joined
                            ? 'bg-umbc-gray-mid text-umbc-gold border border-umbc-gold'
                            : 'bg-umbc-gold text-black hover:bg-umbc-gold-dark'
                        }`}
                      >
                        {joined ? 'Open' : 'Join'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {myGroups.length > 0 && (
              <div>
                <h3 className="text-white font-semibold text-sm mb-2">My Groups</h3>
                <div className="space-y-2">
                  {myGroups.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setActiveGroup(g)}
                      className="w-full bg-umbc-gray border border-umbc-gold/30 rounded-xl p-3 text-left hover:border-umbc-gold transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-sm font-bold text-umbc-gold">
                            {g.courseCode}
                          </span>
                          <span className="text-white text-sm ml-2">{g.courseName}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400">
                            {g.members.length} member{g.members.length !== 1 ? 's' : ''}
                          </div>
                          {g.messages.length > 0 && (
                            <div className="text-xs text-umbc-gold">
                              {g.messages.length} msg
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-white font-semibold text-sm mb-2">All Courses by Department</h3>
              <div className="space-y-1">
                {SORTED_DEPTS.map((dept) => (
                  <Collapsible
                    key={dept}
                    title={<span className="text-sm font-mono">{dept}</span>}
                    defaultOpen={false}
                    badge={DEPT_GROUPS[dept].length}
                    badgeColor="bg-umbc-gray-mid text-gray-300 border border-umbc-gray-light"
                    className="bg-umbc-gray rounded-lg"
                  >
                    <div className="space-y-1 py-2">
                      {DEPT_GROUPS[dept].map((code) => {
                        const info = UMBC_COURSES.find((c) => c.code === code);
                        const joined = studyGroups.some(
                          (g) => g.courseCode === code && g.members.includes(myId)
                        );
                        return (
                          <div
                            key={code}
                            className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-umbc-gray-mid"
                          >
                            <div className="min-w-0">
                              <span className="font-mono text-xs text-umbc-gold">{code}</span>
                              {info && (
                                <span className="text-gray-300 text-xs ml-2 truncate block sm:inline">
                                  {info.name}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleJoin(code)}
                              className={`ml-2 flex-shrink-0 text-xs px-2.5 py-1 rounded font-semibold transition-colors ${
                                joined
                                  ? 'text-umbc-gold border border-umbc-gold/50'
                                  : 'bg-umbc-gold text-black hover:bg-umbc-gold-dark'
                              }`}
                            >
                              {joined ? 'Open' : 'Join'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </Collapsible>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'friends' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                value={friendInput}
                onChange={(e) => setFriendInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
                placeholder="Add friend by name or email..."
                className="input-field text-sm flex-1"
              />
              <button onClick={handleAddFriend} className="btn-gold px-4 py-2 text-sm">
                <UserPlus size={16} />
              </button>
            </div>

            {friends.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No friends added yet. Add a friend to compare schedules.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {friends.map((friend) => {
                  const shared = (friend.sharedCourses || []).filter((c) =>
                    myCourseCodes.includes(c.toUpperCase())
                  );
                  return (
                    <div
                      key={friend.id}
                      className="bg-umbc-gray border border-umbc-gray-light rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-white">{friend.name}</div>
                          <div className="text-gray-400 text-xs">{friend.email}</div>
                          {shared.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {shared.map((c) => (
                                <span
                                  key={c}
                                  className="text-xs bg-umbc-gold/20 text-umbc-gold px-1.5 py-0.5 rounded"
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}
                          {shared.length === 0 && (
                            <div className="text-xs text-gray-600 mt-1">No shared courses</div>
                          )}
                        </div>
                        <button
                          onClick={() => removeFriend(friend.id)}
                          className="text-gray-600 hover:text-red-400 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
