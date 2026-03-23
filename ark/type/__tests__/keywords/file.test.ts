import { attest, contextualize } from "@ark/attest"
import { type } from "arktype"

contextualize(() => {
	it("basic File type", () => {
		const t = type("File")

		const validFile = new File(["content"], "test.txt")
		const anotherFile = new File(["x".repeat(1000)], "data.bin")
		const notAFile = "not a file"
		const alsoNotAFile = { name: "fake.txt" }

		attest(t(validFile)).equals(validFile)
		attest(t(anotherFile)).equals(anotherFile)
		attest(t(notAFile).toString()).snap("must be a File instance (was string)")
		attest(t(alsoNotAFile).toString()).snap(
			"must be a File instance (was object)"
		)
	})

	it("File in object schema", () => {
		const t = type({
			document: "File"
		})

		const validFile = new File(["content"], "doc.pdf")
		const validData = { document: validFile }
		const invalidData = { document: "not-a-file.txt" }

		attest(t(validData)).equals(validData)
		attest(t(invalidData).toString()).snap(
			"document must be a File instance (was string)"
		)
	})
})
