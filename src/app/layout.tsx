import "./globals.css";

const RootLayout = ({children}: {children: React.ReactNode}) => (
	<html lang="en">
		<body>
			<main>{children}</main>
		</body>
	</html>
);

export default RootLayout;
