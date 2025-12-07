import { ColumnDef } from "@tanstack/react-table"
import { Card } from "@/types"
import {
    MoreHorizontal,
    Zap,
    History,
    Pencil,
    Trash2,
    Star,
    Clock,
    CheckCircle2,
    BookOpen,
    Sparkles,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Bookmark
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { formatDistanceToNow, parseISO, isValid, format } from "date-fns"
import { formatInterval } from "@/utils/formatInterval"

const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig: Record<string, {
        label: string;
        icon: React.ReactNode;
        className: string;
    }> = {
        new: {
            label: 'New',
            icon: <Star className="w-3 h-3" strokeWidth={1.5} fill="currentColor" />,
            className: 'text-primary bg-primary/10 border-primary/30'
        },
        learning: {
            label: 'Learning',
            icon: <BookOpen className="w-3 h-3" strokeWidth={1.5} />,
            className: 'text-blue-400 bg-blue-500/10 border-blue-500/30'
        },
        graduated: {
            label: 'Review',
            icon: <Clock className="w-3 h-3" strokeWidth={1.5} />,
            className: 'text-emerald-600 bg-emerald-600/10 border-emerald-600/30'
        },
        known: {
            label: 'Mastered',
            icon: <CheckCircle2 className="w-3 h-3" strokeWidth={1.5} />,
            className: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
        },
    }

    const config = statusConfig[status] || statusConfig.new

    return (
        <span
            className={cn(
                "relative inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider transition-all border rounded-sm",
                "before:absolute before:-top-px before:-left-px before:w-1.5 before:h-1.5 before:border-t-2 before:border-l-2 before:border-current before:opacity-40 before:pointer-events-none",
                "after:absolute after:-bottom-px after:-right-px after:w-1.5 after:h-1.5 after:border-b-2 after:border-r-2 after:border-current after:opacity-40 after:pointer-events-none",
                config.className
            )}
        >
            {config.icon}
            {config.label}
        </span>
    )
}

const ScheduleCell = ({ dateStr, status, interval }: { dateStr: string, status: string, interval: number }) => {
    if (status === 'new') {
        return (
            <div className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="w-3 h-3" strokeWidth={1.5} />
                <span className="text-xs font-medium uppercase tracking-wider">Awaiting</span>
            </div>
        )
    }

    const date = parseISO(dateStr)
    if (!isValid(date)) return <span className="text-muted-foreground/40 text-xs">—</span>

    if (date.getFullYear() === 1970) {
        return (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/50 text-amber-500 rounded-sm">
                <Zap className="w-3 h-3" strokeWidth={2} fill="currentColor" />
                <span className="text-[11px] uppercase tracking-wider font-bold">Priority</span>
            </div>
        )
    }

    const isPast = date < new Date()

    return (
        <div className="space-y-0.5">
            <p className={cn(
                "text-sm font-medium tabular-nums font-editorial",
                isPast ? "text-destructive" : "text-foreground"
            )}>
                {format(date, 'MMM d')}
            </p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                {interval > 0 && `${formatInterval(interval * 24 * 60 * 60 * 1000)} • `}
                {formatDistanceToNow(date, { addSuffix: true })}
            </p>
        </div>
    )
}

const SortableHeader = ({
    column,
    children
}: {
    column: any;
    children: React.ReactNode
}) => {
    const isSorted = column.getIsSorted()

    return (
        <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-2 hover:text-primary transition-colors group"
        >
            <span className="w-1 h-1 rotate-45 bg-primary/40 group-hover:bg-primary transition-colors" />
            {children}
            {isSorted === "asc" ? (
                <ArrowUp className="w-3 h-3 text-primary" />
            ) : isSorted === "desc" ? (
                <ArrowDown className="w-3 h-3 text-primary" />
            ) : (
                <ArrowUpDown className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" />
            )}
        </button>
    )
}

interface ColumnActions {
    onEditCard: (card: Card) => void
    onDeleteCard: (id: string) => void
    onViewHistory: (card: Card) => void
    onPrioritizeCard: (id: string) => void
    onToggleSelect?: (id: string, index: number, isShift: boolean) => void
}

export function getCardColumns(actions: ColumnActions): ColumnDef<Card>[] {
    return [
        {
            id: "select",
            header: ({ table }) => (
                <div className="flex items-center justify-center">
                    <Checkbox
                        checked={
                            table.getIsAllPageRowsSelected() ? true :
                                table.getIsSomePageRowsSelected() ? "indeterminate" : false
                        }
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Select all"
                        className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary text-primary-foreground"
                    />
                </div>
            ),
            cell: ({ row, table }) => {
                const handleClick = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (actions.onToggleSelect) {
                        const rowIndex = table.getRowModel().rows.findIndex(r => r.id === row.id);
                        actions.onToggleSelect(row.id, rowIndex, e.shiftKey);
                    } else {
                        row.toggleSelected();
                    }
                };
                return (
                    <div
                        className="flex items-center justify-center"
                        onClick={handleClick}
                    >
                        <Checkbox
                            checked={row.getIsSelected()}
                            onCheckedChange={() => { }}
                            aria-label="Select row"
                            className="border-muted-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary text-primary-foreground pointer-events-none"
                        />
                    </div>
                );
            },
            enableSorting: false,
            enableHiding: false,
            size: 40,
        },

        {
            accessorKey: "isBookmarked",
            header: ({ column }) => (
                <div className="flex justify-center">
                    <SortableHeader column={column}>
                        <Bookmark size={14} strokeWidth={1.5} />
                    </SortableHeader>
                </div>
            ),
            cell: ({ row }) => {
                const isBookmarked = row.original.isBookmarked;
                if (!isBookmarked) return null;
                return (
                    <div className="flex items-center justify-center">
                        <Bookmark size={14} className="text-primary fill-primary" />
                    </div>
                );
            },
            size: 50,
        },

        {
            accessorKey: "status",
            header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
            cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
            size: 120,
        },

        {
            accessorKey: "targetWord",
            header: ({ column }) => <SortableHeader column={column}>Word</SortableHeader>,
            cell: ({ row }) => {
                const word = row.original.targetWord
                const pos = row.original.targetWordPartOfSpeech

                if (!word) return <span className="text-muted-foreground/40">—</span>

                return (
                    <div className="space-y-0.5">
                        <p className="font-medium text-foreground text-base">{word}</p>
                        {pos && (
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{pos}</p>
                        )}
                    </div>
                )
            },
            size: 140,
        },

        {
            accessorKey: "targetSentence",
            header: ({ column }) => <SortableHeader column={column}>Sentence</SortableHeader>,
            cell: ({ row }) => (
                <p className="text-sm font-light text-foreground/90 line-clamp-2 max-w-[300px]">
                    {row.getValue("targetSentence")}
                </p>
            ),
            filterFn: "includesString",
        },

        {
            accessorKey: "nativeTranslation",
            header: "Translation",
            cell: ({ row }) => (
                <p className="text-sm text-muted-foreground font-light line-clamp-2 max-w-[250px]">
                    {row.getValue("nativeTranslation")}
                </p>
            ),
        },

        {
            accessorKey: "dueDate",
            header: ({ column }) => <SortableHeader column={column}>Due</SortableHeader>,
            cell: ({ row }) => (
                <ScheduleCell
                    dateStr={row.getValue("dueDate")}
                    status={row.original.status}
                    interval={row.original.interval}
                />
            ),
            size: 120,
        },


        {
            id: "actions",
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => {
                const card = row.original

                return (
                    <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                className={cn(
                                    "relative w-8 h-8 flex items-center justify-center transition-all duration-200 outline-none border border-transparent rounded-full",
                                    "text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:border-primary/30",
                                    "opacity-0 group-hover:opacity-100 focus:opacity-100"
                                )}
                            >
                                <MoreHorizontal size={16} strokeWidth={1.5} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 border-border bg-card p-1.5 text-foreground">
                                <DropdownMenuItem
                                    onClick={() => actions.onPrioritizeCard(card.id)}
                                    className="text-sm cursor-pointer py-2 px-3 focus:bg-primary/10 focus:text-primary"
                                >
                                    <Zap size={14} className="mr-2.5 opacity-60" strokeWidth={1.5} />
                                    Priority
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => actions.onViewHistory(card)}
                                    className="text-sm cursor-pointer py-2 px-3 focus:bg-primary/10 focus:text-primary"
                                >
                                    <History size={14} className="mr-2.5 opacity-60" strokeWidth={1.5} />
                                    History
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => actions.onEditCard(card)}
                                    className="text-sm cursor-pointer py-2 px-3 focus:bg-primary/10 focus:text-primary"
                                >
                                    <Pencil size={14} className="mr-2.5 opacity-60" strokeWidth={1.5} />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-1 bg-border" />
                                <DropdownMenuItem
                                    onClick={() => actions.onDeleteCard(card.id)}
                                    className="text-sm cursor-pointer py-2 px-3 text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                    <Trash2 size={14} className="mr-2.5 opacity-60" strokeWidth={1.5} />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            },
            size: 50,
        },
    ]
}
