import matplotlib.pyplot as plt
import sys

# Read CLI args
# x = list(map(float, sys.argv[1].split(',')))
# y = list(map(float, sys.argv[2].split(',')))
# x = list(map(float, sys.argv[1].split(',')))
# print(len(sys.argv[1].split(',')))
# y=[1,2]
# for i in len(x):
#     y.append(i)


y = list(map(float, sys.argv[1].split(',')))
print(len(y))  # Just to confirm the length of x
x = list(range(1, len(y) + 1))

print("x:", x)
print("y:", y)


# Create and save plot
plt.plot(x, y, marker='o')
plt.title("Stress Level line graph")
plt.xlabel("No.of Days")
plt.ylabel("Wellness Level")
plt.grid(True)
plt.tight_layout()
plt.savefig("public/static/plot.png")

plt.bar(x, y, color='blue')
plt.title("Stress Level bar graph")
plt.xlabel("X-axis")
plt.ylabel("Y-axis")
# plt.tight_layout()
plt.savefig("public/static/barplot.png")