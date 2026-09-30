import { prisma } from "@project/db";

export async function createStudent(
    email: string, 
    passwordHash: string) {
        return prisma.student.create({
            data: {
                email,
                passwordHash,
            }
        });
    }