#!/bin/bash
while ! npx prisma db push; do sleep 1; done &&
npm run start
 