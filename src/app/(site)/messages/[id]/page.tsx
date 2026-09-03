import { Conversation } from '@/components/site/Conversation'
export default async function MessagesPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <div className="mx-auto max-w-2xl"><h1 className="mb-5 font-display text-2xl font-bold text-ink">Messages</h1><Conversation id={id} /></div> }
