import sys

with open('src/lib/actions/clients.ts', 'r') as f:
    content = f.read()

# Add projects and projects count to the first include block (getClients)
old_include = """                include: {
                    package: true,
                    quotes: { select: { id: true } }, // Fetch quotes IDs to count them
                    invoices: {
                        select: {
                            id: true,
                            creditNotes: { select: { id: true } } // Fetch credit notes via invoices
                        }
                    },
                    _count: {
                        select: {
                            incomes: {
                                where: { status: 'PAID' }
                            },
                            expenses: true
                        }
                    }
                },"""
new_include = """                include: {
                    package: true,
                    projects: {
                        where: { isDeleted: false },
                        select: { id: true, name: true, budget: true, status: true, incomes: true, expenses: true, stages: true }
                    },
                    quotes: { select: { id: true } }, // Fetch quotes IDs to count them
                    invoices: {
                        select: {
                            id: true,
                            creditNotes: { select: { id: true } } // Fetch credit notes via invoices
                        }
                    },
                    _count: {
                        select: {
                            projects: {
                                where: { isDeleted: false }
                            },
                            incomes: {
                                where: { status: 'PAID' }
                            },
                            expenses: true
                        }
                    }
                },"""

content = content.replace(old_include, new_include)

with open('src/lib/actions/clients.ts', 'w') as f:
    f.write(content)
