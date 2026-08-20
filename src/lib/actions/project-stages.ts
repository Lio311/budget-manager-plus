'use server'

import { authenticatedPrisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

const stageSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  title: z.string().min(1, "Title is required"),
  percentage: z.number().min(0, "Percentage must be positive").max(100, "Percentage cannot exceed 100"),
})

export async function createProjectStage(data: z.infer<typeof stageSchema>) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Unauthorized' };

    const validatedData = stageSchema.parse(data);
    const db = await authenticatedPrisma(userId);

    const project = await db.project.findFirst({
      where: { id: validatedData.projectId, userId }
    });
    if (!project) return { success: false, error: 'Project not found' };

    const existingStagesCount = await db.projectStage.count({
      where: { projectId: validatedData.projectId }
    });

    if (existingStagesCount >= 15) {
      return { success: false, error: 'Cannot exceed 15 stages per project' };
    }

    const existingStages = await db.projectStage.findMany({
      where: { projectId: validatedData.projectId }
    });

    const currentTotal = existingStages.reduce((sum, stage) => sum + stage.percentage, 0);
    if (currentTotal + validatedData.percentage > 100) {
      return { success: false, error: 'Total percentages cannot exceed 100%' };
    }

    const stage = await db.projectStage.create({
      data: {
        projectId: validatedData.projectId,
        title: validatedData.title,
        percentage: validatedData.percentage,
      }
    });

    return { success: true, stage };
  } catch (error) {
    console.error('Failed to create project stage:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function updateProjectStage(id: string, data: z.infer<typeof stageSchema>) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Unauthorized' };

    const validatedData = stageSchema.parse(data);
    const db = await authenticatedPrisma(userId);

    const existingStage = await db.projectStage.findFirst({
      where: { 
        id, 
        project: { userId, id: validatedData.projectId } 
      }
    });

    if (!existingStage) return { success: false, error: 'Stage not found' };

    const existingStages = await db.projectStage.findMany({
      where: { 
        projectId: validatedData.projectId,
        id: { not: id }
      }
    });

    const currentTotal = existingStages.reduce((sum, stage) => sum + stage.percentage, 0);
    if (currentTotal + validatedData.percentage > 100) {
      return { success: false, error: 'Total percentages cannot exceed 100%' };
    }

    const stage = await db.projectStage.update({
      where: { id },
      data: {
        title: validatedData.title,
        percentage: validatedData.percentage,
      }
    });

    return { success: true, stage };
  } catch (error) {
    console.error('Failed to update project stage:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteProjectStage(id: string, deleteLinkedItems: boolean = false) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Unauthorized' };

    const db = await authenticatedPrisma(userId);

    const existingStage = await db.projectStage.findFirst({
      where: { 
        id, 
        project: { userId } 
      }
    });

    if (!existingStage) return { success: false, error: 'Stage not found' };

    if (deleteLinkedItems) {
      await db.$transaction([
        db.expense.deleteMany({ where: { projectStageId: id } }),
        db.income.deleteMany({ where: { projectStageId: id } }),
        db.projectStage.delete({ where: { id } })
      ]);
    } else {
      await db.projectStage.delete({ where: { id } });
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to delete project stage:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
